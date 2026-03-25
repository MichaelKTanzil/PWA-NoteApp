import Dexie, { type EntityTable } from "dexie";

export interface Note {
  id?: number;
  title: string;
  content: string;
  is_synced: boolean;
  offline_action?: "create" | "update" | "delete"; // <--- TAMBAHIN INI
}

class NotesDatabase extends Dexie {
  notes!: EntityTable<Note, "id">;

  constructor() {
    super("NotesDatabase");

    this.version(1).stores({
      notes: "++id, title, is_synced",
    });
  }
}

export const db = new NotesDatabase();
