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
  ],
});
