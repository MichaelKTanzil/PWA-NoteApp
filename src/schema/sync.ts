import { synchronize } from "@nozbe/watermelondb/sync";
import { database } from "./database";
import axios from "axios";

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
}
