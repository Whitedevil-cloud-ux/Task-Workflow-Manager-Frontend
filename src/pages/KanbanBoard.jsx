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

function SortableTask({ task, isDragging }) {
  return (
    <div
      className={clsx(
        "bg-gray-50 border rounded p-3 shadow-sm transition-all",
        isDragging ? "scale-105 shadow-md" : ""
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{task.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {task.description || "No description"}
          </p>
        </div>
        <div className="text-xs text-gray-500 ml-3">{task.priority}</div>
      </div>
    </div>
  );
}

function TaskItem({ task, containerId }) {
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
      <SortableTask task={task} isDragging={isDragging} />
    </div>
  );
}

export default function KanbanBoard() {
  const [stages, setStages] = useState([]);
  const { tasks, setTasks, loadTasks } = useTaskStore();
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stRes] = await Promise.all([api.get("/workflow-stages"), loadTasks()]);
      if (stRes.data?.success) setStages(stRes.data.stages);
    } catch (err) {
      console.error("Load error", err);
      alert("Failed to load Kanban data");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- COLUMN MAPPING --------------------
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

  // -------------------- DRAG START --------------------
  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  // -------------------- DRAG END (FIXED VERSION) --------------------
  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id;

    const from = active.data?.current?.containerId;
    const to =
      over.data?.current?.containerId &&
      over.data.current.containerId !== activeId
        ? over.data.current.containerId
        : over.id;

    if (!from || !to || from === to) return;

    try {
      setSavingId(activeId);

      const fromTasks = [...(columns[from]?.tasks || [])];
      const toTasks = [...(columns[to]?.tasks || [])];

      const itemIndex = fromTasks.findIndex((t) => t._id === activeId);
      if (itemIndex === -1) return;

      const [movedTask] = fromTasks.splice(itemIndex, 1);
      toTasks.push(movedTask);

      const newTaskList = [];
      Object.values(columns).forEach((col) => {
        if (col.stage._id === from) newTaskList.push(...fromTasks);
        else if (col.stage._id === to) newTaskList.push(...toTasks);
        else newTaskList.push(...col.tasks);
      });

      const optimistic = newTaskList.map((t) =>
        t._id === activeId ? { ...t, workflowStage: { _id: to } } : t
      );

      setTasks(optimistic);

      // Persist change
      await api.patch(`/api/tasks/${activeId}/status`, {
        workflowStageId: to,
      });

      await loadTasks();
    } catch (err) {
      console.error("Failed to move task:", err);
      alert("Failed to move task, reverting.");
      await loadTasks();
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="p-8">Loading Kanban...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Kanban Board</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
                <div
                  className="flex-1 space-y-3 min-h-[120px]"
                  data-container-id={col.id}   // <— IMPORTANT
                >
                  {col.tasks.length === 0 && (
                    <div className="text-gray-400 italic text-sm">
                      No tasks yet...
                    </div>
                  )}

                  {col.tasks.map((task) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      containerId={col.id} // pass container ID properly
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
