import React, { useState } from "react";
import { CloudUploadOutlined } from "@ant-design/icons";
import { message, Upload, Typography, Spin } from "antd";
import type { UploadProps } from "antd";
import type { RcFile } from "antd/es/upload/interface";

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface UploaderProps {
  maxSizeMB?: number;
  // Ini senjata rahasianya: Parent component yang bakal ngasih tau file ini mau diapain
  onUpload: (file: RcFile) => Promise<void>;
}

const ReusableUploader: React.FC<UploaderProps> = ({
  maxSizeMB = 10,
  onUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  // Validasi ukuran biar nggak buang-buang resource
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Cuma boleh upload file gambar ya!");
    }
    const isLtMaxSize = file.size / 1024 / 1024 < maxSizeMB;
    if (!isLtMaxSize) {
      message.error(`Ukuran gambar kegedean! Maksimal ${maxSizeMB}MB.`);
    }
    return isImage && isLtMaxSize ? true : Upload.LIST_IGNORE;
  };

  const props: UploadProps = {
    name: "image",
    multiple: false,
    showUploadList: false,
    accept: "image/png, image/jpeg, image/webp",
    beforeUpload,

    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      setIsUploading(true);

      try {
        // Eksekusi fungsi apapun yang dilempar dari parent component
        await onUpload(file as RcFile);

        onSuccess?.("ok");
        message.success("Gambar berhasil diproses!");
      } catch (err) {
        onError?.(err as any);
        message.error("Gagal memproses gambar.");
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    },
  };

  return (
    <div className="w-full mx-auto">
      <Dragger {...props}>
        <div className="flex flex-col items-center justify-center gap-4">
          <Spin spinning={isUploading}>
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined className="text-blue-500 text-6xl" />
            </p>
          </Spin>

          <div>
            <Title level={4} className="mb-1!">
              Klik atau Drop Gambar ke Sini
            </Title>
            <Text type="secondary" className="block text-gray-500">
              Mendukung file <Text strong>JPG, PNG, WEBP</Text>.
            </Text>
            <Text type="secondary" className="block text-gray-400 text-sm mt-2">
              (Maksimal ukuran file: {maxSizeMB}MB)
            </Text>
          </div>
        </div>
      </Dragger>
    </div>
  );
};

export default ReusableUploader;
