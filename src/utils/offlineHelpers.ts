import type { Table } from "dexie";
import { message } from "antd";

// 1. TUKANG SAPU UNIVERSAL
export async function syncServerToLocal<
  T extends {
    id?: number | string;
    is_synced?: boolean;
    offline_action?: string;
  },
>(table: Table<T>, serverData: T[]) {
  // Ambil ID dari server
  const serverIds = serverData.map((item) => Number(item.id));

  // Siapkan data buat disave ke lokal
  const dataToSave = serverData.map((item) => ({
    ...item,
    id: Number(item.id),
    is_synced: true,
    offline_action: undefined,
  })) as T[];

  // Update/Masukkan data server ke lokal
  await table.bulkPut(dataToSave);

  // Cari data hantu/zombie
  const allLocal = await table.toArray();
  const ghostItems = allLocal.filter(
    (localItem) =>
      localItem.is_synced === true && !serverIds.includes(Number(localItem.id)),
  );

  // Sapu bersih
  if (ghostItems.length > 0) {
    const ghostIds = ghostItems.map((n) => Number(n.id));
    console.log(`🧹 Menyapu zombie dari tabel ${table.name}:`, ghostIds);
    await table.bulkDelete(ghostIds);
  }

  // Kembalikan data lokal yang udah bersih
  return await table.toArray();
}

// 2. ERROR HANDLER UNIVERSAL (Khusus 404)
export async function handleMutationError(
  error: any,
  table: Table<any>,
  idToCleanUp?: number | string,
) {
  const isNotFound = error?.response?.status === 404 || error?.status === 404;

  if (isNotFound && idToCleanUp !== undefined) {
    console.warn(
      `Data (ID: ${idToCleanUp}) udah ga ada di server. Sikat dari lokal!`,
    );
    await table.delete(idToCleanUp);
    return true; // Return true tanda data dihapus
  } else {
    message.warning("Kamu lagi offline, data masuk antrean lokal dulu ya.");
    return false;
  }
}
