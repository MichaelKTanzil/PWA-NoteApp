import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const mySchema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: "notes",
      columns: [
        { name: "title", type: "string" },
        { name: "content", type: "string" },
      ],
    }),
    tableSchema({
      name: "to_do_lists",
      columns: [
        { name: "title", type: "string" },
        { name: "content", type: "string" },
        { name: "priority", type: "number" },
        { name: "is_completed", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "xray_images",
      columns: [
        { name: "patient_name", type: "string" },
        { name: "local_file_id", type: "string", isOptional: true }, // Simpan ID LocalForage pas offline
        { name: "file_path", type: "string", isOptional: true }, // Simpan /data/file.jpg dari server
        { name: "is_synced", type: "boolean" }, // Penanda udah masuk server atau belum
      ],
    }),
  ],
});
