import { useEffect, useState } from "react";
import api, { enhanceTaskWithAI } from "../services/api";
import DashboardLayout from "../layout/DashboardLayout";
import dayjs from "dayjs";
import { useTaskStore } from "../store/taskStore";

const Tasks = () => {
  // Zustand store
  const { tasks, loadTasks, addTask, updateTask, removeTask } = useTaskStore();

  // UI state
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    workflowStage: "",
    dueDate: "",
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    id: null,
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    workflowStage: "",
    dueDate: "",
  });

  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);

  // -------------------- FETCH INITIAL DATA --------------------
  useEffect(() => {
    const init = async () => {
      setLoadingLocal(true);
      await Promise.all([loadTasks(), fetchUsers(), fetchStages()]);
      setLoadingLocal(false);
    };
    init();
  }, []);

  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data.users || []);
  };

  const fetchStages = async () => {
    const res = await api.get("/workflow-stages");
    setStages(res.data.stages || []);
  };

  // -------------------- FORM HANDLERS --------------------
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((s) => ({ ...s, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((s) => ({ ...s, [name]: value }));
  };

  // -------------------- AI ENHANCER --------------------
  const enhanceWithAI = async () => {
    if (!createForm.title) {
      alert("Please enter a title first");
      return;
    }

    setAiLoading(true);
    try {
      const res = await enhanceTaskWithAI({
        title: createForm.title,
        description: createForm.description,
      });

      if (res.data.success) {
        setAiPreview(res.data.ai);
      }
    } catch (err) {
      alert("AI enhancement failed");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIResult = () => {
    if (!aiPreview) return;

    setCreateForm((prev) => ({
      ...prev,
      description: aiPreview.improvedDescription,
      priority: aiPreview.suggestedPriority || prev.priority,
    }));

    setAiPreview(null);
  };

  // -------------------- CREATE TASK --------------------
  const submitCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/tasks", createForm);
      if (res.data.success) {
        addTask(res.data.task);
        setShowCreate(false);
        setAiPreview(null);
        setCreateForm({
          title: "",
          description: "",
          priority: "Medium",
          assignedTo: "",
          workflowStage: "",
          dueDate: "",
        });
      }
    } catch {
      alert("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  // -------------------- EDIT TASK --------------------
  const openEdit = (task) => {
    setEditForm({
      id: task._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo?._id,
      workflowStage: task.workflowStage?._id,
      dueDate: task.dueDate ? dayjs(task.dueDate).format("YYYY-MM-DD") : "",
    });
    setShowEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, ...rest } = editForm;
      const res = await api.put(`/api/tasks/${id}`, rest);
      if (res.data.success) {
        updateTask(res.data.task);
        setShowEdit(false);
      }
    } catch {
      alert("Failed to update task");
    }
    setSaving(false);
  };

  // -------------------- DELETE TASK --------------------
  const confirmAndDelete = async (taskId) => {
    if (!confirm("Are you sure?")) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/api/tasks/${taskId}`);
      if (res.data.success) removeTask(taskId);
    } catch {
      alert("Failed to delete task");
    }
    setDeleteLoading(false);
  };

  // -------------------- RENDER --------------------
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          + Add Task
        </button>
      </div>

      {loadingLocal ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task._id} className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-semibold">{task.title}</h2>
              <p className="text-gray-600 mt-2">{task.description}</p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => openEdit(task)}
                  className="px-3 py-1 bg-yellow-400 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmAndDelete(task._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-[500px] p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Create Task</h2>

            <form onSubmit={submitCreate} className="space-y-3">
              <input
                name="title"
                className="w-full p-3 border rounded"
                placeholder="Title"
                value={createForm.title}
                onChange={handleCreateChange}
                required
              />

              <textarea
                name="description"
                className="w-full p-3 border rounded"
                placeholder="Description"
                value={createForm.description}
                onChange={handleCreateChange}
              />

              <button
                type="button"
                onClick={enhanceWithAI}
                className="text-sm text-indigo-600"
              >
                ✨ {aiLoading ? "Enhancing..." : "Enhance with AI"}
              </button>

              {aiPreview && (
                <div className="border rounded p-3 bg-indigo-50 text-sm">
                  <p className="font-medium mb-1">AI Suggestions</p>
                  <p>{aiPreview.improvedDescription}</p>
                  <p className="mt-1">
                    <strong>Priority:</strong> {aiPreview.suggestedPriority}
                  </p>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAiPreview(null)}
                      className="px-3 py-1 bg-gray-300 rounded"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={applyAIResult}
                      className="px-3 py-1 bg-indigo-600 text-white rounded"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded"
              >
                {saving ? "Saving..." : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Tasks;
