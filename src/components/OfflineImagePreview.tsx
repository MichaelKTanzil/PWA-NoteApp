import React, { useEffect, useState } from "react";
import { Spin, Image, Typography } from "antd";
import { xrayStorage } from "../utils/storage";

const { Text } = Typography;

interface Props {
  localFileId: string | undefined;
}

const OfflineImagePreview: React.FC<Props> = ({ localFileId }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadGambar = async () => {
      if (!localFileId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fileBlob = await xrayStorage.getItem<Blob>(localFileId);
        if (fileBlob) {
          objectUrl = URL.createObjectURL(fileBlob);
          setImgSrc(objectUrl);
        }
      } catch (error) {
        console.error("Gagal memuat gambar dari lokal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGambar();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [localFileId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border border-gray-200">
        <Spin tip="Memuat X-Ray lokal..." />
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
        <Text type="danger">
          Gambar offline tidak ditemukan atau sudah dihapus.
        </Text>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 flex justify-center items-center h-48 border-b border-gray-200 overflow-hidden">
      <Image
        src={imgSrc}
        alt="X-Ray Offline"
        width="100%"
        height="100%"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
};

export default OfflineImagePreview;
