import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../layout/DashboardLayout";
import dayjs from "dayjs";
import { useTaskStore } from "../store/taskStore";

const Tasks = () => {
  // Zustand store
  const { tasks, loadTasks, addTask, updateTask, removeTask } = useTaskStore();

  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtaskLoading, setSubtaskLoading] = useState(false);

  // Control which tasks have subtasks shown
  const [showSubtasksFor, setShowSubtasksFor] = useState({});

  // Each task has its own subtask input
  const [subtaskInputFor, setSubtaskInputFor] = useState({});

  // Comments data
  const [taskComments, setTaskComments] = useState({});
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Control which task's comments are expanded
  const [showCommentsFor, setShowCommentsFor] = useState({});

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Local UI state
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    workflowStage: "",
    dueDate: "",
  });

  const [showEdit, setShowEdit] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users & workflow stages
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await api.get("/workflow-stages");
      setStages(res.data.stages || []);
    } catch (err) {
      console.error("Failed to fetch stages:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingLocal(true);
      await Promise.all([loadTasks(), fetchUsers(), fetchStages()]);
      setLoadingLocal(false);
    };
    init();
  }, []);

  const priorityColor = {
    Low: "bg-green-500",
    Medium: "bg-yellow-500",
    High: "bg-orange-500",
    Critical: "bg-red-600",
  };

  const statusLabel = {
    backlog: "Backlog",
    todo: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
  };

  // Create task
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((s) => ({ ...s, [name]: value }));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/tasks", createForm);
      if (res.data.success) {
        addTask(res.data.task);
        setShowCreate(false);
        setCreateForm({
          title: "",
          description: "",
          priority: "Medium",
          assignedTo: "",
          workflowStage: "",
          dueDate: "",
        });
      }
    } catch (err) {
      alert("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  // Edit task 
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((s) => ({ ...s, [name]: value }));
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
    } catch (err) {
      alert("Failed to update task");
    }
    setSaving(false);
  };

  // Delete task
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

  // Fetch comments
  const fetchComments = async (taskId) => {
    try {
      const res = await api.get(`/api/comments/${taskId}`);
      if (res.data.success) {
        setTaskComments((prev) => ({
          ...prev,
          [taskId]: res.data.comments,
        }));
      }
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  };

  // Add comment
  const submitComment = async (taskId) => {
    if (!commentInput.trim()) return;
    setCommentLoading(true);

    try {
      const res = await api.post(`/api/comments/${taskId}`, {
        content: commentInput,
      });

      if (res.data.success) {
        setCommentInput("");
        fetchComments(taskId);
      }
    } catch (err) {
      console.error("Add comment error:", err);
    }

    setCommentLoading(false);
  };

  // Edit comment
  const submitEditComment = async (taskId) => {
    if (!editCommentText.trim()) return;

    try {
      const res = await api.put(`/api/comments/edit/${editingCommentId}`, {
        content: editCommentText,
      });

      if (res.data.success) {
        setEditingCommentId(null);
        setEditCommentText("");
        fetchComments(taskId);
      }
    } catch (err) {
      console.error("Edit comment error:", err);
    }
  };

  // Delete comment
  const deleteComment = async (taskId, id) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await api.delete(`/api/comments/delete/${id}`);
      if (res.data.success) fetchComments(taskId);
    } catch (err) {}
  };

  // Subtasks handlers 
  const fetchSubtasks = async (taskId) => {
  try {
    const res = await api.get(`/api/tasks/${taskId}`);
    if (res.data.success) {
      updateTask(res.data.task); // Zustand update
    }
  } catch (err) {
    console.error("Fetch subtasks error:", err);
  }
};

  const addSubtask = async (taskId) => {
  const text = subtaskInputFor[taskId] || "";
  if (!text.trim()) return;

  setSubtaskLoading(true);

  try {
    const res = await api.post(`/api/tasks/${taskId}/subtasks`, {
      title: text,
    });

    updateTask({ _id: taskId, subtasks: res.data.subtasks });

    // clear only this task’s input
    setSubtaskInputFor((prev) => ({
      ...prev,
      [taskId]: "",
    }));
  } catch (err) {}

  setSubtaskLoading(false);
};


  const toggleSubtask = async (taskId, sub) => {
    try {
      const res = await api.put(`/api/tasks/${taskId}/subtasks/${sub._id}`, {
        isDone: !sub.isDone,
      });
      updateTask({ _id: taskId, subtasks: res.data.subtasks });
    } catch (err) {}
  };

  const deleteSubtask = async (taskId, subId) => {
    try {
      const res = await api.delete(`/api/tasks/${taskId}/subtasks/${subId}`);
      updateTask({ _id: taskId, subtasks: res.data.subtasks });
    } catch (err) {}
  };


  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          + Add Task
        </button>
      </div>

      {/* Task List */}
      {loadingLocal ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const comments = taskComments[task._id] || [];

            return (
              <div
                key={task._id}
                className="bg-white rounded-xl shadow p-5 border border-gray-200"
              >
                <div className="flex justify-between">
                  <h2 className="text-xl font-semibold">{task.title}</h2>
                  <span
                    className={`px-3 py-1 text-xs rounded-full text-white ${priorityColor[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="text-gray-600 mt-2">{task.description}</p>

                <div className="mt-3 text-sm">
                  <span>Status: {statusLabel[task.status]}</span>{" "}
                  {task.dueDate && (
                    <span className="text-gray-500">
                      • Due {dayjs(task.dueDate).format("DD MMM")}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  Assigned: {task.assignedTo?.name}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => openEdit(task)}
                    className="px-3 py-1 bg-yellow-400 text-white rounded-lg text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmAndDelete(task._id)}
                    disabled={deleteLoading}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>

                {/* Toggle Comments */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => {
                      setShowCommentsFor((prev) => ({
                        ...prev,
                        [task._id]: !prev[task._id],
                      }));
                      if (!showCommentsFor[task._id]) fetchComments(task._id);
                    }}
                    className="mt-4 text-blue-600 text-sm"
                  >
                    {showCommentsFor[task._id]
                      ? "Hide Comments"
                      : "Show Comments"}
                  </button>

                  {/* Toggle Subtasks */}
                <button
                  onClick={() => {
                    setShowSubtasksFor((prev) => ({
                      ...prev,
                      [task._id]: !prev[task._id],
                    }));
                  }}
                  className="mt-2 text-indigo-600 text-sm"
                >
                  {showSubtasksFor[task._id] ? "Hide" : "Subtasks"}
                </button>
              </div>

                {/* SUBTASKS */}
                {showSubtasksFor[task._id] && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Subtasks</h3>

                    {/* Progress bar */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width:
                              (task.subtasks.filter((s) => s.isDone).length /
                                task.subtasks.length) *
                                100 +
                              "%",
                          }}
                        ></div>
                      </div>
                    )}

                    {/* Subtask list */}
                    <div className="space-y-2">
                      {task.subtasks?.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center gap-3 bg-gray-100 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={sub.isDone}
                            onChange={() => toggleSubtask(task._id, sub)}
                            className="w-5 h-5"
                          />

                          <span
                            className={`${sub.isDone ? "line-through text-gray-400" : ""}`}
                          >
                            {sub.title}
                          </span>

                          <button
                            onClick={() => deleteSubtask(task._id, sub._id)}
                            className="ml-auto text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Subtask */}
                    <div className="flex mt-3 gap-2">
                      <input
                        value={subtaskInputFor[task._id] || ""}
                        onChange={(e) =>
                          setSubtaskInputFor((prev) => ({
                            ...prev,
                            [task._id]: e.target.value,
                          }))
                        }
                        placeholder="New subtask..."
                        className="p-2 border rounded flex-1"
                      />

                      <button
                        onClick={() => addSubtask(task._id)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded"
                      >
                        {subtaskLoading ? "..." : "Add"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments Area */}
                {showCommentsFor[task._id] && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Comments</h3>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {comments.length === 0 && (
                        <p className="text-gray-500 italic">
                          No comments yet.
                        </p>
                      )}

                      {comments.map((c) => (
                        <div
                          key={c._id}
                          className="bg-gray-100 p-3 rounded relative"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <span className="font-medium">
                              {c.userId?.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {dayjs(c.createdAt).format("DD MMM, HH:mm")}
                            </span>
                          </div>

                          {editingCommentId === c._id ? (
                            <div className="mt-2">
                              <input
                                value={editCommentText}
                                onChange={(e) =>
                                  setEditCommentText(e.target.value)
                                }
                                className="p-2 border rounded w-full"
                              />

                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() =>
                                    submitEditComment(task._id)
                                  }
                                  className="px-3 py-1 bg-green-600 text-white rounded"
                                >
                                  Save
                                </button>

                                <button
                                  onClick={() =>
                                    setEditingCommentId(null)
                                  }
                                  className="px-3 py-1 bg-gray-500 text-white rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2">{c.content}</p>
                          )}

                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(c._id);
                                setEditCommentText(c.content);
                              }}
                              className="text-blue-600 text-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                deleteComment(task._id, c._id)
                              }
                              className="text-red-600 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex mt-3 gap-2">
                      <input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="p-2 border rounded flex-1"
                        placeholder="Write a comment..."
                      />
                      <button
                        onClick={() => submitComment(task._id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                      >
                        {commentLoading ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl">
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

              <div className="grid grid-cols-2 gap-3">
                <select
                  name="priority"
                  className="p-3 border rounded"
                  value={createForm.priority}
                  onChange={handleCreateChange}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>

                <input
                  type="date"
                  name="dueDate"
                  className="p-3 border rounded"
                  value={createForm.dueDate}
                  onChange={handleCreateChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  name="assignedTo"
                  className="p-3 border rounded"
                  value={createForm.assignedTo}
                  onChange={handleCreateChange}
                  required
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  name="workflowStage"
                  className="p-3 border rounded"
                  value={createForm.workflowStage}
                  onChange={handleCreateChange}
                  required
                >
                  <option value="">Select stage</option>
                  {stages.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  {saving ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-[500px] p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

            <form onSubmit={submitEdit} className="space-y-3">
              <input
                name="title"
                className="w-full p-3 border rounded"
                placeholder="Title"
                value={editForm.title}
                onChange={handleEditChange}
                required
              />

              <textarea
                name="description"
                className="w-full p-3 border rounded"
                placeholder="Description"
                value={editForm.description}
                onChange={handleEditChange}
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  name="priority"
                  className="p-3 border rounded"
                  value={editForm.priority}
                  onChange={handleEditChange}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>

                <input
                  type="date"
                  name="dueDate"
                  className="p-3 border rounded"
                  value={editForm.dueDate}
                  onChange={handleEditChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  name="assignedTo"
                  className="p-3 border rounded"
                  value={editForm.assignedTo}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  name="workflowStage"
                  className="p-3 border rounded"
                  value={editForm.workflowStage}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select stage</option>
                  {stages.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Tasks;
