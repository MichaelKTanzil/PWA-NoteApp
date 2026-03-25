import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { db, type Note } from "../schema/db";
import {
  deleteNoteFromLaravel,
  fetchNotesFromLaravel,
  syncNoteToLaravel,
  updateNotesToLaravel,
} from "../api";
import {
  handleMutationError,
  syncServerToLocal,
} from "../utils/offlineHelpers";

export function useNotes() {
  const queryClient = useQueryClient();
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      try {
        const response = await fetchNotesFromLaravel();
        // Panggil fungsi reusable!
        return await syncServerToLocal(db.notes, response);
      } catch (error) {
        console.warn("Gagal fetch dari server, pakai data lokal yang ada.");
        return await db.notes.toArray();
      }
    },
    networkMode: "offlineFirst",
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // 2. MUTATIONS (Pake Error Handler Universal)
  const deleteMutation = useMutation({
    mutationFn: deleteNoteFromLaravel,
    networkMode: "always",
    onSuccess: async (_, id) => {
      message.success("Catatan berhasil dihapus dari server!");
      await db.notes.delete(id);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: async (error, id) => {
      // Panggil fungsi reusable!
      const isDeleted = await handleMutationError(
        error,
        db.notes,
        id as number,
      );
      if (isDeleted) queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateNotesToLaravel,
    networkMode: "always",
    onSuccess: async (_, updatedNote) => {
      message.success("Catatan berhasil diperbarui di server!");
      await db.notes.update(updatedNote.id, {
        is_synced: true,
        offline_action: undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: async (error, updatedNote) => {
      // Panggil fungsi reusable!
      const isDeleted = await handleMutationError(
        error,
        db.notes,
        updatedNote.id as number,
      );
      if (isDeleted) queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (localNote: Note) => {
      const response = await syncNoteToLaravel(localNote);
      return { serverData: response.data || response, localId: localNote.id };
    },
    networkMode: "always",
    onSuccess: async ({ serverData, localId }) => {
      if (localId !== undefined && localId !== null) {
        await db.notes.delete(localId);
        await db.notes.put({
          ...serverData,
          id: Number(serverData.id),
          is_synced: true,
          offline_action: undefined,
        });
        message.success(`Catatan berhasil di-sync ke server!`);
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      }
    },
    onError: (error) => handleMutationError(error, db.notes),
  });

  // 3. AUTO SYNC EFFECT
  useEffect(() => {
    const syncPendingNotes = async () => {
      if (!navigator.onLine) return;
      try {
        const allNotes = await db.notes.toArray();
        const pendingNotes = allNotes.filter(
          (note) => note.is_synced === false,
        );
        if (pendingNotes.length === 0) return;

        message.loading({
          content: `Mensinkronkan ${pendingNotes.length} catatan...`,
          key: "syncing",
        });

        for (const note of pendingNotes) {
          if (note.offline_action === "update")
            await updateMutation.mutateAsync(note);
          else if (note.offline_action === "delete")
            await deleteMutation.mutateAsync(note.id as number);
          else await addMutation.mutateAsync(note);
        }

        message.success({
          content: "Semua data offline berhasil di-sync!",
          key: "syncing",
        });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      } catch (error) {
        console.error("Gagal auto-sync:", error);
      }
    };

    syncPendingNotes();
    window.addEventListener("online", syncPendingNotes);
    return () => window.removeEventListener("online", syncPendingNotes);
  }, []);

  // 4. HANDLERS YANG DIEKSPOR KE UI
  const handleAddNote = async (title: string, content: string) => {
    try {
      const newNoteId = await db.notes.add({
        title,
        content,
        is_synced: false,
        offline_action: "create",
      });
      const noteToSync: Note = {
        id: newNoteId as number,
        title,
        content,
        is_synced: false,
      };

      queryClient.setQueryData(["notes"], (old: Note[] = []) => [
        ...old,
        noteToSync,
      ]);
      addMutation.mutate(noteToSync);
      return true; // Return true tanda sukses biar UI bisa clear form
    } catch (error) {
      message.error("Gagal nyimpen catatan ke database lokal.");
      return false;
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      const existingNote = await db.notes.get(updatedNote.id);
      const finalAction =
        existingNote?.offline_action === "create" ? "create" : "update";

      await db.notes.update(updatedNote.id, {
        ...updatedNote,
        is_synced: false,
        offline_action: finalAction,
      });

      queryClient.setQueryData(["notes"], (old: Note[] = []) =>
        old.map((note) =>
          note.id === updatedNote.id
            ? {
                ...note,
                ...updatedNote,
                is_synced: false,
                offline_action: finalAction,
              }
            : note,
        ),
      );

      if (finalAction === "create") addMutation.mutate(updatedNote);
      else updateMutation.mutate(updatedNote);
    } catch (error) {
      message.error("Gagal memperbarui catatan di database lokal.");
    }
  };

  const handleDeleteNote = async (noteToDelete: Note) => {
    try {
      const existingNote = await db.notes.get(noteToDelete.id);
      if (existingNote?.offline_action === "create") {
        await db.notes.delete(noteToDelete.id);
        queryClient.setQueryData(["notes"], (old: Note[] = []) =>
          old.filter((n) => n.id !== noteToDelete.id),
        );
        return;
      }

      await db.notes.update(noteToDelete.id, {
        is_synced: false,
        offline_action: "delete",
      });
      queryClient.setQueryData(["notes"], (old: Note[] = []) =>
        old.filter((n) => n.id !== noteToDelete.id),
      );
      if (noteToDelete.id) deleteMutation.mutate(noteToDelete.id as number);
    } catch (error) {
      message.error("Gagal menghapus catatan.");
    }
  };

  // Return data dan function yang dibutuhin komponen UI
  return {
    notes,
    isLoading,
    isAdding: addMutation.isPending,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
  };
}
