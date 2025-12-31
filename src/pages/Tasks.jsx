import { useEffect, useState } from "react";
import api, {
  enhanceTaskWithAI,
  suggestSubtasksWithAI,
} from "../services/api";
import DashboardLayout from "../layout/DashboardLayout";
import { useTaskStore } from "../store/taskStore";
import { getMe } from "../services/user";

const Tasks = () => {
  const { tasks, loadTasks, addTask, removeTask, updateTask } =
    useTaskStore();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aiPreview, setAiPreview] = useState(null);
  const [aiSubtasks, setAiSubtasks] = useState([]);
  const [aiSubtaskLoading, setAiSubtaskLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    workflowStage: "",
  });

  const [editForm, setEditForm] = useState({
    id: null,
    title: "",
    description: "",
    priority: "Medium",
  });

  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          loadTasks(),
          fetchUsers(),
          fetchStages(),
          loadMe(),
        ]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadMe = async () => {
    try {
      const res = await getMe();
      setCurrentUser(res?.data?.user || null);
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data.users || []);
  };

  const fetchStages = async () => {
    const res = await api.get("/workflow-stages");
    setStages(res.data.stages || []);
  };

  /* ---------------- AI ---------------- */
  const enhanceWithAI = async () => {
    if (!createForm.title) return alert("Enter title first");

    const res = await enhanceTaskWithAI({
      title: createForm.title,
      description: createForm.description,
    });

    setAiPreview(res.data.ai);
  };

  const applyAIResult = () => {
    if (!aiPreview) return;
    setCreateForm((p) => ({
      ...p,
      description: aiPreview.improvedDescription,
      priority: aiPreview.suggestedPriority || p.priority,
    }));
    setAiPreview(null);
  };

  const generateSubtasksWithAI = async () => {
    if (!createForm.title) return alert("Enter title first");

    setAiSubtaskLoading(true);
    try {
      const res = await suggestSubtasksWithAI({
        title: createForm.title,
        description: createForm.description,
      });
      setAiSubtasks(res.data.subtasks || []);
    } finally {
      setAiSubtaskLoading(false);
    }
  };

  /* ---------------- CREATE ---------------- */
  const submitCreate = async (e) => {
    e.preventDefault();

    if (!createForm.assignedTo || !createForm.workflowStage) {
      return alert("Assign user & workflow stage required");
    }

    setSaving(true);
    try {
      const res = await api.post("/api/tasks", {
        ...createForm,
        subtasks: aiSubtasks.map((t) => ({
          title: t,
          isDone: false,
        })),
      });

      addTask(res.data.task);
      setShowCreate(false);
      setAiSubtasks([]);
      setAiPreview(null);
      setCreateForm({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        workflowStage: "",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- EDIT ---------------- */
  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/api/tasks/${editForm.id}`, editForm);
      updateTask(res.data.task);
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <DashboardLayout>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          + Add Task
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-xl shadow p-5 space-y-3"
            >
              <div>
                <h2 className="text-xl font-semibold">{task.title}</h2>
                <p className="text-gray-600">{task.description}</p>
              </div>

              {/* SUBTASKS */}
              {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-sm font-semibold">Subtasks</p>
                  <ul className="space-y-1">
                    {task.subtasks.map((sub) => (
                      <li key={sub._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!sub.isDone}
                          onChange={async () => {
                            const updated = {
                              ...task,
                              subtasks: task.subtasks.map((s) =>
                                s._id === sub._id
                                  ? { ...s, isDone: !s.isDone }
                                  : s
                              ),
                            };
                            updateTask(updated);
                            await api.patch(
                              `/api/tasks/${task._id}/subtasks/${sub._id}`,
                              { isDone: !sub.isDone }
                            );
                          }}
                        />
                        <span
                          className={
                            sub.isDone
                              ? "line-through text-gray-400"
                              : ""
                          }
                        >
                          {sub.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ACTIONS */}
              {task.createdBy?._id === currentUser?._id && (
                <div className="flex gap-3 text-sm">
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditForm({
                        id: task._id,
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                      });
                      setShowEdit(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600"
                    onClick={async () => {
                      if (!confirm("Delete task?")) return;
                      await api.delete(`/api/tasks/${task._id}`);
                      removeTask(task._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[520px] p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Create Task</h2>

            <form onSubmit={submitCreate} className="space-y-3">
              <input
                className="w-full p-3 border rounded"
                placeholder="Title"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                required
              />

              <textarea
                className="w-full p-3 border rounded"
                placeholder="Description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    description: e.target.value,
                  })
                }
              />

              <select
                className="w-full p-3 border rounded"
                value={createForm.assignedTo}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    assignedTo: e.target.value,
                  })
                }
                required
              >
                <option value="">Assign to</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full p-3 border rounded"
                value={createForm.workflowStage}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    workflowStage: e.target.value,
                  })
                }
                required
              >
                <option value="">Workflow stage</option>
                {stages.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={enhanceWithAI}
                className="text-indigo-600 text-sm"
              >
                Enhance with AI
              </button>

              <button
                type="button"
                onClick={generateSubtasksWithAI}
                className="text-purple-600 text-sm"
              >
                Suggest subtasks
              </button>

              {aiSubtasks.length > 0 && (
                <div className="bg-purple-50 p-3 rounded text-sm">
                  <p className="font-medium mb-2">AI Subtasks</p>
                  {aiSubtasks.map((s, i) => (
                    <div key={i}>✔ {s}</div>
                  ))}
                </div>
              )}

              {aiPreview && (
                <div className="bg-indigo-50 p-3 rounded text-sm">
                  <p>{aiPreview.improvedDescription}</p>
                  <button
                    type="button"
                    onClick={applyAIResult}
                    className="mt-2 text-indigo-600"
                  >
                    Apply
                  </button>
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

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[520px] p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            <form onSubmit={submitEdit} className="space-y-3">
              <input
                className="w-full p-3 border rounded"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
              <textarea
                className="w-full p-3 border rounded"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description: e.target.value,
                  })
                }
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded"
              >
                {saving ? "Saving..." : "Update Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Tasks;
