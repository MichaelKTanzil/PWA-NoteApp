import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const mySchema = appSchema({
  version: 3,
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
  ],
});
