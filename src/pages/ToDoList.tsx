import React, { useEffect, useState } from "react";
import { Button, Card, Flex, Input, Space, Typography, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { database } from "../schema/database";
import type ToDoListType from "../schema/ToDoList";
import { syncWatermelonDB } from "../schema/sync";
import withObservables from "@nozbe/with-observables";

const { Title, Text } = Typography;
const { TextArea } = Input;
type Priority = 0 | 1 | 2;

interface Props {
  tasks: ToDoListType[];
}

const ToDoList = ({ tasks }: Props) => {
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

  const handleAddTask = async () => {
    if (!title) {
      message.warning("Judul tugas gak boleh kosong, bro!");
      return;
    }

    await database.write(async () => {
      await database.collections
        .get<ToDoListType>("to_do_lists")
        .create((toDoList) => {
          toDoList.title = title;
          toDoList.content = content;
          toDoList.priority = 0;
          toDoList.is_completed = false;
        });
    });

    setTitle("");
    setContent("");
    message.success("Tugas berhasil ditambah & tersimpan di lokal!");

    handleSync();
  };

  const handleDeleteTask = async (taskRecord: ToDoListType) => {
    console.log("🚨 NAMA TUGAS:", taskRecord.title);
    console.log("🚨 STATUS LOKAL:", taskRecord.syncStatus);

    if (taskRecord.syncStatus === "created") {
      alert(
        "Ketahuan! Pantes payload kosong. Lokal masih ngira data ini belum pernah dikirim ke server (status: created)!",
      );
    }

    await database.write(async () => {
      await taskRecord.markAsDeleted();
    });

    handleSync();
    message.success("Tugas dihapus!");
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, newPriority: Priority) => {
    console.log(
      "🚀 Drop event! ID tugas yang di-drop:",
      e.dataTransfer.getData("taskId"),
    );

    const draggedId = e.dataTransfer.getData("taskId");
    const taskToUpdate = tasks.find((task) => task.id === draggedId);

    if (taskToUpdate && taskToUpdate.priority !== newPriority) {
      await database.write(async () => {
        await taskToUpdate.update((task) => {
          task.priority = newPriority;
        });
      });
      syncWatermelonDB();
    }
  };

  const renderColumn = (titleColumn: string, priorityType: Priority) => {
    const filteredTasks = tasks.filter(
      (task) => task.priority === priorityType,
    );

    return (
      <Card
        title={`${titleColumn} (${filteredTasks.length})`}
        className="w-full md:w-1/3 shadow-sm rounded-xl h-fit min-h-[300px]"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, priorityType)}
      >
        <Flex vertical gap="middle">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <Card
                key={task.id}
                type="inner"
                title={task.title}
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteTask(task)}
                  />
                }
                draggable
                onDragStart={(e) => onDragStart(e, task.id)}
                className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
              >
                <Text>{task.content}</Text>
              </Card>
            ))
          ) : (
            <Text className="text-gray-400 text-center block mt-4">
              Belum ada tugas.
            </Text>
          )}
        </Flex>
      </Card>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <Flex
        vertical
        className="max-h-screen mx-auto align-middle! justify-center!"
        gap="middle"
      >
        <Title level={2} className="text-center mb-0!">
          Kanban To-Do List
        </Title>

        <Card className="shadow-sm rounded-xl w-full max-w-2xl self-center">
          <Space orientation="vertical" className="w-full" size="middle">
            <Input
              placeholder="Judul Tugas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextArea
              rows={4}
              placeholder="Tulis detail tugasnya di sini..."
              style={{ resize: "none" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTask}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="large"
              disabled={isSyncing}
            >
              Simpan Tugas
            </Button>
          </Space>
        </Card>

        <Flex
          vertical={false}
          gap="large"
          className="w-full justify-between items-start flex-col md:flex-row"
        >
          {renderColumn("To Do", 0)}
          {renderColumn("Urgent", 1)}
          {renderColumn("Stop / Blocker", 2)}
        </Flex>
      </Flex>
    </div>
  );
};

const EnhancedToDoList = withObservables([], () => ({
  tasks: database.collections
    .get<ToDoListType>("to_do_lists")
    .query()
    .observeWithColumns(["priority"]),
}))(ToDoList);

export default EnhancedToDoList;
