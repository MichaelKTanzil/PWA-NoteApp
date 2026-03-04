import type { Note } from "./db";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/notes"; // Sesuaikan dengan port artisan serve lu

export const syncNoteToLaravel = async (note: Note) => {
  const response = await axios.post(API_URL, {
    title: note.title,
    content: note.content,
  });

  return response.data;
};

export const fetchNotesFromLaravel = async (): Promise<Note[]> => {
  const response = await axios.get(API_URL);
  return response.data.data as Note[];
};

export const updateNotesToLaravel = async (note: Note) => {
  const response = await axios.put(`${API_URL}/${note.id}`, {
    id: note.id,
    title: note.title,
    content: note.content,
  });
  return response.data;
};

export const deleteNoteFromLaravel = async (id: number) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
