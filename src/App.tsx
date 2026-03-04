import React, { useState } from "react";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu, Typography } from "antd";
import Notes from "./Notes";

const { Title } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    key: "sub1",
    label: "Aplikasi Utama",
    icon: <MailOutlined />,
    children: [
      { key: "1", label: "Notes" },
      { key: "2", label: "To Do List" },
    ],
  },
  {
    key: "sub2",
    label: "Laporan",
    icon: <AppstoreOutlined />,
    children: [
      { key: "5", label: "Harian" },
      { key: "6", label: "Bulanan" },
    ],
  },
  {
    key: "sub4",
    label: "Pengaturan",
    icon: <SettingOutlined />,
    children: [
      { key: "9", label: "Profil" },
      { key: "10", label: "Sinkronisasi" },
    ],
  },
];

const App: React.FC = () => {
  // 'current' nyimpen key dari menu yang lagi aktif (default "1" = Notes)
  const [current, setCurrent] = useState("1");

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("Pindah ke tab key: ", e.key);
    setCurrent(e.key); // Update state pas menu diklik
  };

  // FUNGSI INI KUNCINYA: Nentuin konten berdasarkan state 'current'
  const renderContent = () => {
    switch (current) {
      case "1":
        return <Notes />;
      case "2":
        return (
          <div>
            <Title level={2}>Halaman To Do List</Title>
            <p>Daftar tugas kamu muncul di sini.</p>
          </div>
        );
      default:
        return (
          <div
            style={{ textAlign: "center", marginTop: "50px", color: "gray" }}
          >
            <h2>Pilih menu di samping</h2>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          width: 296,
          overscrollBehavior: "none",
        }}
      >
        <Menu
          theme={"dark"}
          onClick={onClick}
          style={{
            width: "100%",
            height: "100%",
            borderRight: 0,
          }}
          defaultOpenKeys={["sub1"]}
          selectedKeys={[current]}
          mode="inline"
          items={items}
        />
      </div>

      <div style={{ flex: 1, padding: "0px", overflowY: "auto" }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
