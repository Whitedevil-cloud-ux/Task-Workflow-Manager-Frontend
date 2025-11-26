import { useEffect, useState } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import useCommentsSocket from "../hooks/useCommentsSocket";

export default function TaskComments({ taskId, userId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  // Enable real-time updates
  useCommentsSocket(taskId, setComments);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    const res = await api.get(`/api/comments/${taskId}`);
    if (res.data?.success) setComments(res.data.comments);
  };

  const addComment = async () => {
    if (!text.trim()) return;

    await api.post(`/api/comments/${taskId}`, { content: text });
    setText(""); // backend + socket will handle updating
  };

  const deleteComment = async (id) => {
    await api.delete(`/api/comments/delete/${id}`);
    // realtime will remove it automatically
  };

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          placeholder="Add a comment..."
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          onClick={addComment}
        >
          Post
        </button>
      </div>

      {/* Comment List */}
      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-gray-500 text-sm">No comments yet.</p>
        )}

        {comments.map((c) => (
          <div
            key={c._id}
            className="p-3 border rounded-lg bg-white shadow-sm flex justify-between"
          >
            <div>
              <p className="font-medium">{c.userId?.name}</p>
              <p>{c.content}</p>
              <p className="text-xs text-gray-400">
                {dayjs(c.createdAt).format("DD MMM YYYY • HH:mm")}
              </p>
            </div>

            {c.userId?._id === userId && (
              <button
                className="text-red-500 text-sm"
                onClick={() => deleteComment(c._id)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
