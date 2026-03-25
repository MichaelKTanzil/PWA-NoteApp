import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { mySchema } from "./schema";
import Note from "./Note";
import migrations from "../model/migrations";
import ToDoList from "./ToDoList";
import XrayImage from "./Model/XrayImage";

const adapter = new LokiJSAdapter({
  schema: mySchema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: "NotesAppDB_Watermelon",
  extraLokiOptions: {
    autosave: true,
    autosaveInterval: 250,
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Note, ToDoList, XrayImage],
});
