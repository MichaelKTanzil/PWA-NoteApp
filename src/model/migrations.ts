import {
  schemaMigrations,
  createTable,
  addColumns,
} from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: "to_do_lists",
          columns: [
            { name: "title", type: "string" },
            { name: "content", type: "string" },
            { name: "priority", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 3, // Instruksi dari versi 2 ke 3
      steps: [
        addColumns({
          table: "to_do_lists",
          columns: [{ name: "is_completed", type: "boolean" }],
        }),
      ],
    },
    {
      toVersion: 4, // Instruksi dari versi 3 ke 4
      steps: [
        createTable({
          name: "xray_images",
          columns: [
            { name: "patient_name", type: "string" },
            { name: "local_file_id", type: "string", isOptional: true }, // Simpan ID LocalForage pas offline
            { name: "file_path", type: "string", isOptional: true }, // Simpan /data/file.jpg dari server
            { name: "is_synced", type: "boolean" }, // Penanda udah masuk server atau belum
          ],
        }),
      ],
    },
  ],
});
