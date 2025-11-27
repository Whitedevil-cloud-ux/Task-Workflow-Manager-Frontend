import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_API_URL;

const socket = io(BACKEND, {
  auth: {
    token: localStorage.getItem("token"),
  },
  withCredentials: true,
  transports: ["websocket"], // optional but recommended
});

export default socket;
