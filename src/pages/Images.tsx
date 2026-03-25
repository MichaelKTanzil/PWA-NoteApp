import React, { useEffect, useState } from "react";
import withObservables from "@nozbe/with-observables";
import { database } from "../schema/database";
import XrayImage from "../schema/Model/XrayImage";
import Uploader from "../components/Uploader";
import OfflineImagePreview from "../components/OfflineImagePreview";
import { Card, Flex, Typography, Tag, Button, message, Image } from "antd";
import {
  CloudOutlined,
  CloudSyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { xrayStorage } from "../utils/storage";
import type { RcFile } from "antd/es/upload";
import { syncWatermelonDB } from "../schema/sync";
import { syncOfflineImages } from "../utils/syncOfflineImages";

const { Title, Text } = Typography;

interface ImagesPageProps {
  xrayImages: XrayImage[];
}

const ImagesPage: React.FC<ImagesPageProps> = ({ xrayImages }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const performSync = async () => {
      if (!navigator.onLine) return;

      setIsSyncing(true);
      try {
        console.log("🔄 Memulai Auto-Sync Gambar...");
        await syncOfflineImages();
        message.success("Auto-Sync Gambar Berhasil!");
      } catch (error) {
        console.error("🚨 Gagal Auto-Sync:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    performSync();

    window.addEventListener("online", performSync);

    return () => {
      window.removeEventListener("online", performSync);
    };
  }, []);

  const trySyncUpload = async (file: RcFile) => {
    try {
      await syncOfflineImages();
      message.success("Gambar berhasil disinkronkan dengan server!");

      // Setelah sinkronisasi, refresh data di halaman ini biar status nya update
      // (Karena kita pakai withObservables, data akan otomatis update kalau database berubah)
    } catch (error) {
      message.error("Gagal sinkronisasi gambar. Coba lagi nanti.");
      console.error("Error sinkronisasi gambar:", error);
    }
  };

  const handleXrayUpload = async (file: RcFile) => {
    try {
      const uniqueFileId = `xray_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await xrayStorage.setItem(uniqueFileId, file);
      const newRecord = await database.write(async () => {
        return await database.collections
          .get("xray_images")
          .create((record: any) => {
            record.patientName = "Pasien Test 01";
            record.localFileId = uniqueFileId;
            record.isSynced = false;
          });
      });
      console.log("✅ 2. WatermelonDB Sukses! Data masuk:", newRecord);
      await trySyncUpload(file);
    } catch (error) {
      console.error("❌ GAGAL TOTAL BRO:", error);
      message.error("Gagal simpan ke database lokal! Cek console.");
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncWatermelonDB();
      message.success("Sinkronisasi Teks & Gambar berhasil, bro!");
    } catch (error) {
      message.error(
        "Waduh, sinkronisasi gagal. Cek koneksi server Laravel lu.",
      );
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <Flex vertical gap="large">
        <Flex align="center" justify="space-between">
          <div>
            <Title level={2} className="mb-0!">
              Galeri X-Ray Offline
            </Title>
            <Text type="secondary">
              Data tersimpan aman di perangkat Anda saat offline.
            </Text>
          </div>
          <Flex gap="small" align="center">
            <Tag
              color="warning"
              icon={<CloudOutlined />}
              className="px-4 py-1 m-0 rounded-full"
            >
              Offline Mode
            </Tag>
            <Button
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={isSyncing}
              onClick={handleManualSync}
              className="rounded-full shadow-sm bg-blue-600 hover:bg-blue-500"
            >
              Sync Sekarang
            </Button>
          </Flex>
        </Flex>

        <Card className="shadow-sm rounded-xl border border-gray-100">
          <Flex vertical gap="middle">
            <Title level={4} className="mb-0 text-gray-700">
              Upload Hasil X-Ray Baru
            </Title>
            <Uploader maxSizeMB={5} onUpload={handleXrayUpload} />
          </Flex>
        </Card>

        <div>
          <Title level={4} className="mb-4 text-gray-700">
            Daftar Antrean Sinkronisasi ({xrayImages.length})
          </Title>

          <Flex gap="middle" wrap="wrap" className="w-full">
            {xrayImages.length > 0 ? (
              xrayImages.map((image) => (
                <Card
                  key={image.id}
                  className="w-full md:w-[320px] shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 overflow-hidden"
                  bodyStyle={{ padding: "12px" }}
                  cover={
                    image.isSynced && image.filePath ? (
                      <div className="bg-gray-100 flex justify-center items-center h-48 border-b border-gray-200 overflow-hidden">
                        <Image
                          src={`http://localhost:8000${image.filePath}`}
                          alt="X-Ray Synced"
                          fallback="https://via.placeholder.com/300?text=Gambar+Rusak"
                          width="100%"
                          height="100%"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <OfflineImagePreview localFileId={image.localFileId} />
                    )
                  }
                >
                  <Card.Meta
                    title={
                      <Flex align="center" justify="space-between">
                        <Text strong className="text-lg">
                          {image.patientName}
                        </Text>
                        <Tag
                          color={image.isSynced ? "success" : "processing"}
                          icon={
                            image.isSynced ? (
                              <CheckCircleOutlined />
                            ) : (
                              <CloudSyncOutlined spin />
                            )
                          }
                          className="rounded-full"
                        >
                          {image.isSynced ? "Synced" : "Offline"}
                        </Tag>
                      </Flex>
                    }
                    description={
                      <Text type="secondary" className="text-xs">
                        ID Lokal:{" "}
                        <span className="font-mono bg-gray-100 p-0.5 rounded">
                          {image.localFileId}
                        </span>
                      </Text>
                    }
                  />
                </Card>
              ))
            ) : (
              <div className="w-full flex justify-center items-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Text type="secondary" className="text-center">
                  <CloudOutlined className="text-6xl text-gray-200 block mb-4" />
                  Belum ada gambar yang tersimpan secara offline. <br />
                  Silakan upload gambar baru di atas.
                </Text>
              </div>
            )}
          </Flex>
        </div>
      </Flex>
    </div>
  );
};

const EnhancedImagesPage = withObservables([], () => ({
  xrayImages: database.collections
    .get<XrayImage>("xray_images")
    .query()
    .observeWithColumns(["is_synced", "file_path"]),
}))(ImagesPage);

export default EnhancedImagesPage;
