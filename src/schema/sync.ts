import { synchronize } from "@nozbe/watermelondb/sync";
import { database } from "./database";
import axios from "axios";
import { syncOfflineImages } from "../utils/syncOfflineImages";

const API_URL = "http://127.0.0.1:8000/api/notes/sync";

export async function syncWatermelonDB() {
  await synchronize({
    database,

    pullChanges: async ({ lastPulledAt }) => {
      const response = await axios.get(
        `${API_URL}?last_pulled_at=${lastPulledAt || 0}`,
      );

      const { changes, timestamp } = response.data;
      return { changes, timestamp };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      await axios.post(API_URL, { changes, lastPulledAt });
    },
  });

  console.log("Sinkronisasi teks selesai, bro!");

  console.log("Mulai sinkronisasi gambar offline...");
  await syncOfflineImages();
  console.log("Sinkronisasi selesai, bro!");
}
