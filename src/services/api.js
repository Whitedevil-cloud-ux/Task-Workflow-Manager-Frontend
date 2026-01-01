import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const enhanceTaskWithAI = (payload) => {
  return api.post("/api/ai/enhance-task", payload);
};

export const suggestSubtasksWithAI = (payload) => 
  api.post("/api/ai/suggest-subtasks", payload);

export const getTaskRisk = (taskId) => {
  return api.get(`/api/tasks/${taskId}/risk`);
};

export const createTaskFromNLP = (text) =>
  api.post("/api/tasks/nlp", { text }); 

export default api;
