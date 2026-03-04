import { useState } from "react";
import { Button, Input, Card, Typography, Space, Spin, Flex } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { type Note } from "../db";
import { useNotes } from "../hooks/useNotes";

const { Title, Text } = Typography;
const { TextArea } = Input;

function Notes() {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [updateNote, setUpdateNote] = useState<Note | null>(null);

  // Panggil semua logic dari Custom Hook
  const {
    notes,
    isLoading,
    isAdding,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
  } = useNotes();

  const onSubmitNote = async () => {
    if (!title || !content) return;
    const isSuccess = await handleAddNote(title, content);
    if (isSuccess) {
      setTitle("");
      setContent("");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Title level={2} className="text-center mb-8">
          My Notes App (Offline First)
        </Title>

        {/* Form Input */}
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
              style={{ resize: "none" }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onSubmitNote}
              loading={isAdding}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="large"
            >
              Simpan Catatan
            </Button>
          </Space>
        </Card>

        {/* List Catatan */}
        {isLoading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <Text className="block mt-4 text-gray-500">Memuat catatan...</Text>
          </div>
        ) : (
          <Space orientation="vertical" className="w-full pt-4" size="middle">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="shadow-sm hover:shadow-md transition-shadow relative"
              >
                {updateNote && updateNote.id === note.id ? (
                  <Flex vertical gap="small">
                    <Input
                      value={updateNote.title}
                      onChange={(e) =>
                        setUpdateNote({ ...updateNote, title: e.target.value })
                      }
                    />
                    <TextArea
                      rows={4}
                      value={updateNote.content}
                      onChange={(e) =>
                        setUpdateNote({
                          ...updateNote,
                          content: e.target.value,
                        })
                      }
                    />
                    <Flex gap="middle" justify="end">
                      <Button onClick={() => setUpdateNote(null)}>Batal</Button>
                      <Button
                        type="primary"
                        onClick={() => {
                          handleUpdateNote(updateNote);
                          setUpdateNote(null);
                        }}
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
                      <Text className="text-gray-600 mt-2 block">
                        {note.content}
                      </Text>
                      <Flex gap="small" justify="end">
                        <Button onClick={() => setUpdateNote(note)}>
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteNote(note)}
                          type="dashed"
                          danger
                        >
                          Hapus
                        </Button>
                      </Flex>
                    </Flex>
                    <div
                      className={`absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full ${
                        note.is_synced
                          ? "bg-green-100 text-green-700"
                          : note.offline_action == "delete"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {note.is_synced
                        ? "✅ Synced"
                        : note.offline_action == "delete"
                          ? "❌ Deleted"
                          : "⏳ Offline"}
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
        )}
      </div>
    </div>
  );
}

export default Notes;
