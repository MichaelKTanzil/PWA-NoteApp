import { useEffect, useState } from "react";
import { Button, Input, Card, Typography, Space, Flex, message } from "antd";
import { PlusOutlined, SyncOutlined } from "@ant-design/icons";
import withObservables from "@nozbe/with-observables";
import { database } from "../schema/database";
import Note from "../schema/Note";
import { syncWatermelonDB } from "../schema/sync";

const { Title, Text } = Typography;
const { TextArea } = Input;

const NoteList = ({ notes }: { notes: Note[] }) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleEditClick = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWatermelonDB();
      message.success("Sinkronisasi sukses!");
    } catch (error) {
      message.error("Gagal sinkronisasi. Cek koneksi.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEdit = async (note: Note) => {
    try {
      await database.write(async () => {
        await note.update((n) => {
          n.title = editTitle;
          n.content = editContent;
        });
      });
      setEditingNoteId(null);
      message.success("Catatan berhasil diedit di lokal!");
      handleSync();
    } catch (error) {
      console.error(error);
      message.error("Gagal ngedit catatan.");
    }
  };

  const handleDelete = async (note: Note) => {
    await database.write(async () => {
      await note.markAsDeleted();
    });
    handleSync();
    message.success("Catatan dihapus (menunggu sync).");
  };

  return (
    <Space orientation="vertical" className="w-full pt-4" size="middle">
      {notes.map((note) => (
        <Card
          key={note.id}
          className="shadow-sm hover:shadow-md transition-shadow relative"
        >
          {editingNoteId === note.id ? (
            <Flex vertical gap="small">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul Catatan"
              />
              <TextArea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Isi Catatan"
              />
              <Flex gap="middle" justify="end">
                <Button onClick={() => setEditingNoteId(null)}>Batal</Button>
                <Button
                  type="primary"
                  onClick={() => handleSaveEdit(note)}
                  disabled={isSyncing}
                >
                  Simpan Perubahan
                </Button>
              </Flex>
            </Flex>
          ) : (
            <>
              <Title level={4} className="m-0">
                {note.title}
              </Title>
              <Flex gap="middle" align="start" justify="space-between">
                <Text className="text-gray-600 mt-2 block">{note.content}</Text>

                <Flex gap="small" justify="end">
                  <Button onClick={() => handleEditClick(note)}>Edit</Button>
                  <Button
                    onClick={() => handleDelete(note)}
                    type="dashed"
                    color="red"
                    danger
                    disabled={isSyncing}
                  >
                    Hapus
                  </Button>
                </Flex>
              </Flex>

              <div
                className={`absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full ${
                  note.syncStatus === "synced"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {note.syncStatus === "synced" ? "✅ Synced" : "⏳ Offline"}
              </div>
            </>
          )}
        </Card>
      ))}

      {notes.length === 0 && (
        <Text className="text-center block text-gray-400 mt-8">
          Belum ada catatan nih, bikin baru yuk!
        </Text>
      )}
    </Space>
  );
};

const EnhancedNoteList = withObservables([], () => ({
  notes: database.collections.get<Note>("notes").query().observe(),
}))(NoteList);

export default function Notes() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const performSync = async () => {
      if (!navigator.onLine) return;

      setIsSyncing(true);
      try {
        console.log("🔄 Memulai Auto-Sync...");
        await syncWatermelonDB();
        message.success("Auto-Sync Berhasil!");
      } catch (error) {
        console.error("🚨 Gagal Auto-Sync:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    performSync();

    window.addEventListener("online", performSync);

    return () => {
      window.removeEventListener("online", performSync);
    };
  }, []);

  const handleAddNote = async () => {
    if (!title || !content) return;

    try {
      await database.write(async () => {
        await database.collections.get<Note>("notes").create((note) => {
          note.title = title;
          note.content = content;
        });
      });
      setTitle("");
      setContent("");
      message.success("Tersimpan di lokal!");
      handleSync();
    } catch (error) {
      console.error("🚨 Error WatermelonDB:", error);
      message.error("Gagal nyimpen catatan.");
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWatermelonDB();
      message.success("Sinkronisasi sukses!");
    } catch (error) {
      message.error("Gagal sinkronisasi. Cek koneksi.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Flex justify="space-between" align="center" className="mb-8">
          <Title level={2} className="m-0">
            Watermelon Notes
          </Title>
          <Button
            icon={<SyncOutlined spin={isSyncing} />}
            onClick={handleSync}
            loading={isSyncing}
          >
            Sync Now
          </Button>
        </Flex>

        <Card className="mb-8 shadow-sm rounded-xl">
          <Space orientation="vertical" className="w-full" size="middle">
            <Input
              placeholder="Judul Catatan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextArea
              rows={4}
              placeholder="Tulis apa aja di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNote}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="large"
            >
              Simpan Catatan
            </Button>
          </Space>
        </Card>

        <Button
          onClick={async () => {
            const data = await database.collections
              .get("notes")
              .query()
              .fetch();
            console.log("🕵️ ISI BRANKAS LOKAL:", data);
            alert(`Ada ${data.length} catatan nangkring di lokal!`);
          }}
          className="mt-4"
        >
          CCTV Lokal
        </Button>

        <EnhancedNoteList />
      </div>
    </div>
  );
}
