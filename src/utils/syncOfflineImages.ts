import axios from "axios";
import { database } from "../schema/database";
import { xrayStorage } from "./storage";
import XrayImage from "../schema/Model/XrayImage";
import { Q } from "@nozbe/watermelondb"; // Import buat query

const API_URL = "http://localhost:8000/api/upload-xray";

export const syncOfflineImages = async () => {
  try {
    console.log("Memulai proses sinkronisasi gambar X-Ray...");

    // 1. Cari semua data X-Ray di WatermelonDB yang BELUM SYNC
    const unsyncedRecords = await database.collections
      .get<XrayImage>("xray_images")
      .query(Q.where("is_synced", false))
      .fetch();

    if (unsyncedRecords.length === 0) {
      console.log("Semua gambar X-Ray sudah tersinkronisasi. Aman!");
      return;
    }

    // 2. Looping data yang belum sync (bisa banyak gambar kan)
    for (const record of unsyncedRecords) {
      // Ambil ID lokalnya (buat bongkar brankas LocalForage)
      const localId = record.localFileId;
      if (!localId) continue; // Jaga-jaga kalau kosong

      console.log(`Mengambil fisik file ${localId} dari LocalForage...`);

      // 3. Tarik WUJUD ASLI (Blob/File) dari LocalForage
      const fileBlob = await xrayStorage.getItem<Blob>(localId);

      if (!fileBlob) {
        console.warn(`File ${localId} tidak ditemukan di penyimpanan lokal.`);
        continue; // Lanjut ke gambar berikutnya
      }

      // 4. Siapkan FormData buat dikirim ke Laravel
      // Ini wajib pake FormData karena kita mau ngirim file (bukan JSON teks)
      const formData = new FormData();
      // 'image' ini adalah nama field yang bakal dibaca Laravel ($request->file('image'))
      formData.append("image", fileBlob, `${localId}.jpg`);
      formData.append("patient_name", record.patientName);
      formData.append("watermelon_id", record.id); // Opsional: kasih tau Laravel ID Watermelon-nya

      try {
        console.log(`Mengunggah ${localId} ke server Laravel...`);

        // 5. Tembak pakai Axios
        const response = await axios.post(API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            // Tambahin Authorization Token di sini kalau API lu butuh login (Sanctum/JWT)
            // 'Authorization': `Bearer ${token}`
          },
        });

        // 6. Kalau server bilang sukses (200 OK)
        if (response.data.success) {
          console.log(`Sukses unggah! Server Path: ${response.data.path}`);

          // A. Update data di WatermelonDB (isi filePath & ubah status jadi true)
          await database.write(async () => {
            await record.update((r: any) => {
              r.filePath = response.data.path; // "/data/namafileacak.jpg"
              r.isSynced = true;
            });
          });

          // B. Hapus fisik file dari LocalForage (Biar RAM HP lega)
          await xrayStorage.removeItem(localId);
          console.log(`File lokal ${localId} berhasil dihapus.`);
        }
      } catch (uploadError) {
        // Kalau upload 1 gambar gagal (misal server down), jangan berhentiin semua loop
        console.error(`Gagal unggah ${localId}:`, uploadError);
      }
    }

    console.log("Proses sinkronisasi gambar X-Ray selesai.");
  } catch (error) {
    console.error("Gagal menjalankan fungsi syncOfflineImages:", error);
  }
};
