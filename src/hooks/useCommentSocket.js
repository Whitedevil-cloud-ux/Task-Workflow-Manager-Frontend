import { useEffect } from "react";
import socket from "../services/socket";

export default function useCommentsSocket(taskId, setComments) {

  useEffect(() => {
    if (!taskId) return;

    // Join task-specific room (optional)
    socket.emit("join", taskId);

    const handleAdded = (comment) => {
      if (comment.taskId === taskId) {
        setComments((prev) => [comment, ...prev]);
      }
    };

    const handleUpdated = (comment) => {
      if (comment.taskId === taskId) {
        setComments((prev) =>
          prev.map((c) => (c._id === comment._id ? comment : c))
        );
      }
    };

    const handleDeleted = ({ _id, taskId: deletedTaskId }) => {
      if (deletedTaskId === taskId) {
        setComments((prev) => prev.filter((c) => c._id !== _id));
      }
    };

    socket.on("comment_added", handleAdded);
    socket.on("comment_updated", handleUpdated);
    socket.on("comment_deleted", handleDeleted);

    return () => {
      socket.off("comment_added", handleAdded);
      socket.off("comment_updated", handleUpdated);
      socket.off("comment_deleted", handleDeleted);

      socket.emit("leave", taskId);
    };
  }, [taskId, setComments]);
}
