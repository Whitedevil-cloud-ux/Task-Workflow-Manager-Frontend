// src/store/taskStore.js
import { create } from "zustand";
import api from "../services/api";

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,

  // Load all tasks from backend (canonical)
  loadTasks: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/api/tasks");
      set({ tasks: res.data.tasks || [] });
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      set({ loading: false });
    }
  },

  // Replace tasks (useful after authoritative fetch)
  setTasks: (newTasks) => set({ tasks: newTasks }),

  // Add task to store (used after successful create)
  addTask: (task) => {
    const { tasks } = get();
    set({ tasks: [...tasks, task] });
  },

  // Update single task object (used after edit or server update)
  updateTask: (updatedTask) => {
    const { tasks } = get();
    const newTasks = tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t));
    set({ tasks: newTasks });
  },

  // Remove task by id (used after delete)
  removeTask: (taskId) => {
    const { tasks } = get();
    set({ tasks: tasks.filter((t) => t._id !== taskId) });
  },
}));
