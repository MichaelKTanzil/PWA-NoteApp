import localforage from "localforage";

export const xrayStorage = localforage.createInstance({
  name: "ProdiaOfflineDB",
  storeName: "xray_images_vault",
  description: "Gudang penyimpanan fisik gambar X-Ray saat offline",
});
