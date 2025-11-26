// src/pages/Workflow.jsx
import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import api from "../services/api";
import DashboardLayout from "../layout/DashboardLayout";
import { v4 as uuidv4 } from "uuid";

/* ---------- Sortable Stage Item ---------- */
function StageItem({ stage, listeners, attributes, setNodeRef, transform, transition, isDragging, onEdit, onDelete }) {
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx("bg-white rounded-md p-4 shadow flex items-center justify-between gap-3")}
    >
      <div className="flex items-center gap-3">
        <div style={{ backgroundColor: stage.color || "#999" }} className="w-3 h-3 rounded-full" />
        <div>
          <div className="font-semibold">{stage.name}</div>
          <div className="text-xs text-gray-400">Order: {stage.order}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(stage)} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded">Edit</button>
        <button onClick={() => onDelete(stage)} className="text-sm px-3 py-1 bg-red-500 text-white rounded">Delete</button>
      </div>
    </div>
  );
}

/* ---------- wrapper using useSortable ---------- */
function SortableStage({ stage, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage._id });

  return (
    <StageItem
      stage={stage}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      transform={transform}
      transition={transition}
      isDragging={isDragging}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

/* ---------- Workflow Page ---------- */
export default function Workflow() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editStage, setEditStage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#60a5fa");

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor)
  );

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workflow-stages");
      if (res.data?.success) setStages(res.data.stages || []);
    } catch (err) {
      console.error("Failed to load stages", err);
      alert("Failed to load workflow stages");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setNewName("");
    setNewColor("#60a5fa");
    setShowAdd(true);
  };

  const createStage = async (e) => {
    e?.preventDefault();
    if (!newName.trim()) return alert("Name required");
    setSaving(true);
    try {
      const res = await api.post("/workflow-stages", { name: newName.trim(), color: newColor });
      if (res.data?.success) {
        // append and keep order
        setStages((s) => [...s, res.data.stage].sort((a, b) => (a.order || 0) - (b.order || 0)));
        setShowAdd(false);
      } else {
        alert(res.data?.message || "Failed to create stage");
      }
    } catch (err) {
      console.error("Create stage error", err);
      alert("Failed to create stage");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (stage) => {
    setEditStage(stage);
    setNewName(stage.name || "");
    setNewColor(stage.color || "#60a5fa");
  };

  const submitEdit = async (e) => {
    e?.preventDefault();
    if (!editStage) return;
    setSaving(true);
    try {
      const res = await api.put(`/workflow-stages/${editStage._id}`, { name: newName.trim(), color: newColor });
      if (res.data?.success) {
        setStages((prev) => prev.map((s) => (String(s._id) === String(editStage._id) ? res.data.stage : s)));
        setEditStage(null);
      } else {
        alert(res.data?.message || "Failed to update stage");
      }
    } catch (err) {
      console.error("Update stage error", err);
      alert("Failed to update stage");
    } finally {
      setSaving(false);
    }
  };

  const deleteStage = async (stage) => {
    if (!confirm(`Delete stage "${stage.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/workflow-stages/${stage._id}`);
      if (res.data?.success) {
        setStages((s) => s.filter((x) => String(x._id) !== String(stage._id)));
      } else {
        alert(res.data?.message || "Failed to delete stage");
      }
    } catch (err) {
      console.error("Delete stage error", err);
      alert("Failed to delete stage");
    }
  };

  // dnd-kit drag end -> reorder
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    // compute new order
    const oldIndex = stages.findIndex((s) => String(s._id) === String(active.id));
    const newIndex = stages.findIndex((s) => String(s._id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newStages = arrayMove(stages, oldIndex, newIndex).map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(newStages);

    // persist order to server
    try {
      const orderedIds = newStages.map((s) => s._id);
      await api.patch("/workflow-stages/reorder", { orderedIds });
      // reload authoritative state (optional)
      const res = await api.get("/workflow-stages");
      if (res.data?.success) setStages(res.data.stages);
    } catch (err) {
      console.error("Reorder error", err);
      alert("Failed to save new order – reverting.");
      await loadStages();
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="p-6">Loading workflow stages...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Workflow Builder</h1>
          <div className="flex items-center gap-3">
            <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded">+ Add Stage</button>
            <button onClick={loadStages} className="px-3 py-2 bg-gray-100 rounded">Reload</button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 max-w-2xl">
              {stages.map((stage) => (
                <SortableStage key={stage._id} stage={stage} onEdit={openEdit} onDelete={deleteStage} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {/* minimal visual while dragging */}
            <div className="bg-white rounded-md p-3 shadow w-80">
              {/* find active item label */}
              <div>{stages.find((s) => String(s._id) === String(activeId))?.name}</div>
            </div>
          </DragOverlay>
        </DndContext>

        {/* ADD MODAL */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[420px]">
              <h3 className="text-lg font-semibold mb-3">Add Stage</h3>
              <form onSubmit={createStage} className="space-y-3">
                <input className="w-full p-2 border rounded" placeholder="Stage name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div className="flex items-center gap-3">
                  <label className="text-sm">Color</label>
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded">{saving ? "Adding..." : "Add"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editStage && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[420px]">
              <h3 className="text-lg font-semibold mb-3">Edit Stage</h3>
              <form onSubmit={submitEdit} className="space-y-3">
                <input className="w-full p-2 border rounded" placeholder="Stage name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div className="flex items-center gap-3">
                  <label className="text-sm">Color</label>
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditStage(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded">{saving ? "Saving..." : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
