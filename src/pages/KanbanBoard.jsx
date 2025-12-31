import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../services/api";
import clsx from "clsx";
import { useTaskStore } from "../store/taskStore";

/* ---------------- SORTABLE TASK CARD ---------------- */
function SortableTask({ task, isDragging, onDelete }) {
  return (
    <div
      className={clsx(
        "bg-gray-50 border rounded p-3 shadow-sm transition-all space-y-2",
        isDragging ? "scale-105 shadow-md" : ""
      )}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{task.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {task.description || "No description"}
          </p>
        </div>
        <span className="text-xs text-gray-500 ml-3">{task.priority}</span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 text-xs">
        <button
          onClick={() => alert("Edit modal coming next")}
          className="text-blue-600 hover:underline"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(task._id)}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>

      {/* SUBTASKS */}
      {task.subtasks?.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            Subtasks
          </p>
          <ul className="space-y-1">
            {task.subtasks.map((sub) => (
              <li key={sub._id} className="flex items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    sub.isDone ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={sub.isDone ? "line-through text-gray-400" : ""}
                >
                  {sub.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- DRAGGABLE WRAPPER ---------------- */
function TaskItem({ task, containerId, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task._id,
      data: { containerId },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <SortableTask
        task={task}
        isDragging={isDragging}
        onDelete={onDelete}
      />
    </div>
  );
}

/* ---------------- MAIN BOARD ---------------- */
export default function KanbanBoard() {
  const [stages, setStages] = useState([]);
  const { tasks, setTasks, loadTasks } = useTaskStore();
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /* LOAD DATA (IMPORTANT FIX) */
  useEffect(() => {
    loadAll();
  }, [loadTasks]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stRes] = await Promise.all([
        api.get("/workflow-stages"),
        loadTasks(),
      ]);
      if (stRes.data?.success) setStages(stRes.data.stages);
    } catch (err) {
      console.error("Load error", err);
      alert("Failed to load Kanban data");
    } finally {
      setLoading(false);
    }
  };

  /* DELETE HANDLER */
  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      await loadTasks(); // 🔥 THIS IS THE KEY
    } catch {
      alert("Failed to delete task");
    }
  };

  /* COLUMN MAPPING */
  const columns = useMemo(() => {
    const map = {};
    const orderedStages = [...stages].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    orderedStages.forEach((s) => {
      map[s._id] = { stage: s, tasks: [] };
    });

    tasks.forEach((task) => {
      const sid = task.workflowStage?._id || orderedStages[0]?._id;
      if (!map[sid])
        map[sid] = { stage: { _id: sid, name: "Other" }, tasks: [] };
      map[sid].tasks.push(task);
    });

    return map;
  }, [tasks, stages]);

  const orderedColumns = useMemo(() => {
    return stages
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((s) => ({
        id: s._id,
        stage: s,
        tasks: columns[s._id]?.tasks ?? [],
      }));
  }, [stages, columns]);

  if (loading) return <div className="p-8">Loading Kanban...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Kanban Board</h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {orderedColumns.map((col) => (
            <div
              key={col.id}
              className="w-[320px] bg-white rounded-lg shadow p-4 flex flex-col"
            >
              <div className="flex justify-between mb-3">
                <h2 className="font-semibold">{col.stage.name}</h2>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: col.stage.color }}
                />
              </div>

              <SortableContext
                id={col.id}
                items={col.tasks.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 space-y-3 min-h-[120px]">
                  {col.tasks.length === 0 && (
                    <div className="text-gray-400 italic text-sm">
                      No tasks yet...
                    </div>
                  )}

                  {col.tasks.map((task) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      containerId={col.id}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
