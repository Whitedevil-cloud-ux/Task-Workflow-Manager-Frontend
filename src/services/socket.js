import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const token = localStorage.getItem("token");

const socket = io(BACKEND, {
  auth: {
    token,
  },
  withCredentials: true,
});

export default socket;
