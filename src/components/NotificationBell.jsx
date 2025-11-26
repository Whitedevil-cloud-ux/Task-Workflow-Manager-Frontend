// src/components/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import { BellIcon } from "@heroicons/react/24/outline";
import socket from "../services/socket";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const mounted = useRef(false);

  const unread = list.filter((n) => !n.isRead).length;

  // Load initial notifications
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const res = await api.get("/notifications");
        if (res.data?.success) {
          setList(res.data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, []);

  // Socket: listen for realtime notifications
  useEffect(() => {
    // Ensure socket connects (socket client should be configured to autoConnect or connect elsewhere)
    try {
      if (!socket.connected) socket.connect();

      const onNotification = (n) => {
        // prepend and keep list reasonable (limit to 50)
        setList((prev) => {
          // avoid duplicates
          if (prev.some((x) => x._id === n._id)) return prev;
          const next = [n, ...(prev || [])].slice(0, 50);
          return next;
        });

        // optional small visual cue: briefly open panel
        // setOpen(true);
      };

      socket.on("notification", onNotification);

      return () => {
        socket.off("notification", onNotification);
      };
    } catch (err) {
      console.error("Socket error (notification)", err);
    }
  }, []);

  const markRead = async (id) => {
    try {
      // optimistic update
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Mark read failed", err);
      // revert (simple strategy: reload)
      loadNotifications();
    }
  };

  const markAll = async () => {
    try {
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await api.patch(`/notifications/read-all`);
    } catch (err) {
      console.error("Mark all failed", err);
      loadNotifications();
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) setList(res.data.notifications || []);
    } catch (err) {
      console.error("Reload notifications failed", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((s) => !s);
          // if opening, mark small behavior: you could mark all visible as read here if you want
        }}
        className="relative"
        aria-label="Notifications"
      >
        <BellIcon className="w-7 h-7 text-gray-700" />

        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg p-3 max-h-96 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Notifications</h3>
            <button
              className="text-sm text-indigo-600"
              onClick={() => {
                markAll();
              }}
            >
              Mark all as read
            </button>
          </div>

          {list.length === 0 ? (
            <p className="text-gray-500 text-sm p-3">No notifications</p>
          ) : (
            list.map((n) => (
              <div
                key={n._id}
                className={`p-3 rounded cursor-pointer mb-1 transition-colors ${
                  n.isRead ? "bg-gray-50 hover:bg-gray-100" : "bg-indigo-50 hover:bg-indigo-100"
                }`}
                onClick={() => {
                  if (!n.isRead) markRead(n._id);
                  if (n.taskId?._id) {
                    // go to task (use react-router if you prefer)
                    window.location.href = `/tasks?task=${n.taskId._id}`;
                  }
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {dayjs(n.createdAt).format("DD MMM • HH:mm")}
                    </p>
                  </div>

                  {!n.isRead && <div className="text-xs text-indigo-700 font-medium">New</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
