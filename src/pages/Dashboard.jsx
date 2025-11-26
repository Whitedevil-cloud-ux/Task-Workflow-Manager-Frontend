// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import api from "../services/api";
import dayjs from "dayjs";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  });


  const [me, setMe] = useState(null);
  const [filter, setFilter] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState([]);
  const [upcomingGroups, setUpcomingGroups] = useState([]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priorityColor = {
    Low: "bg-green-200 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-orange-100 text-orange-800",
    Critical: "bg-red-100 text-red-800",
  };

  const loadDashboard = async () => {
    try {
      // NOTE: backend mounts tasks under /api/tasks
      const res = await api.get("/api/tasks");
      if (res.data?.success) {
        const all = res.data.tasks || [];
        setTasks(all);

        const today = dayjs().startOf("day");
        const in7 = dayjs().add(7, "day").endOf("day");

        const profile = await api.get("/users/me");
        if (profile.data?.success) setMe(profile.data.user);

        const completed = all.filter((t) => t.status === "completed").length;
        const pending = all.filter(
          (t) =>
            t.status === "todo" ||
            t.status === "backlog" ||
            t.status === "in_progress"
        ).length;

        const overdue = all.filter(
          (t) => t.dueDate && dayjs(t.dueDate).isBefore(today, "day")
        ).length;

        setStats({
          total: all.length,
          completed,
          pending,
          overdue,
        });

        setRecent(all.slice(0, 5));

        // upcoming: due between today (inclusive) and next 7 days (inclusive)
        const upcoming = all.filter((t) => {
          if (!t.dueDate) return false;
          const d = dayjs(t.dueDate);
          return (d.isSame(today, "day") || (d.isAfter(today) && d.isBefore(in7))) || d.isSame(in7, "day");
        });

        // group by date (DD MMM YYYY)
        const groups = {};
        upcoming.forEach((t) => {
          const key = dayjs(t.dueDate).format("DD MMM YYYY");
          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
        });

        // sort group keys ascending
        const orderedKeys = Object.keys(groups).sort((a, b) => {
          return dayjs(a, "DD MMM YYYY").isAfter(dayjs(b, "DD MMM YYYY")) ? 1 : -1;
        });

        const orderedGroups = orderedKeys.map((k) => ({
          dateLabel: k,
          tasks: groups[k].sort((a, b) => dayjs(a.dueDate).isAfter(dayjs(b.dueDate)) ? 1 : -1)
        }));

        setUpcomingGroups(orderedGroups);
      }

      // activity endpoint is mounted at /activity in your app.js
      const act = await api.get("/activity");
      if (act.data?.success) setActivity(act.data.activities || []);
    } catch (err) {
      console.error("Dashboard load error", err);
    }
  };

  const openTask = (taskId) => {
    // navigate to Tasks page with query param — Tasks page can read this query and open modal if implemented
    navigate(`/tasks?task=${taskId}`);
  };

  const pieData = {
    labels: ["Backlog", "To Do", "In Progress", "Completed"],
    datasets: [
      {
        data: [
          tasks.filter((t) => t.status === "backlog").length,
          tasks.filter((t) => t.status === "todo").length,
          tasks.filter((t) => t.status === "in_progress").length,
          tasks.filter((t) => t.status === "completed").length,
        ],
        backgroundColor: ["#64748b", "#3b82f6", "#f59e0b", "#10b981"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <SummaryCard title="Total Tasks" value={stats.total} color="blue" />
          <SummaryCard title="Completed" value={stats.completed} color="green" />
          <SummaryCard title="Pending" value={stats.pending} color="yellow" />
          <SummaryCard title="Overdue" value={stats.overdue} color="red" />
        </div>

        {/* CHART + UPCOMING DEADLINES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Task Breakdown</h2>
            <Pie data={pieData} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>

            {upcomingGroups.length === 0 ? (
              <p className="text-gray-500">No upcoming tasks in the next 7 days.</p>
            ) : (
              <div className="space-y-4">
                {upcomingGroups.map((group) => (
                  <div key={group.dateLabel}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {group.dateLabel}{" "}
                        {dayjs(group.dateLabel, "DD MMM YYYY").isSame(dayjs(), "day") && (
                          <span className="text-sm text-indigo-600 ml-2"> — Today</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">{group.tasks.length} task{group.tasks.length>1?'s':''}</div>
                    </div>

                    <ul className="space-y-2">
                      {group.tasks.map((t) => {
                        const isOverdue = t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), "day");
                        return (
                          <li
                            key={t._id}
                            onClick={() => openTask(t._id)}
                            className="p-3 border rounded-lg hover:shadow cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-semibold">{t.title}</div>
                              <div className="text-xs text-gray-500">
                                Due: {t.dueDate ? dayjs(t.dueDate).format("DD MMM, HH:mm") : "—"}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`text-xs px-2 py-1 rounded ${priorityColor[t.priority] || "bg-gray-100 text-gray-700"}`}>
                                {t.priority}
                              </div>

                              {isOverdue ? (
                                <div className="text-xs text-red-600 font-semibold">Overdue</div>
                              ) : (
                                <div className="text-xs text-gray-400">{t.status?.replace("_"," ")}</div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RECENT TASKS */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>

          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t._id} className="border-b">
                  <td className="py-2">{t.title}</td>
                  <td className="capitalize">{t.status?.replace("_", " ")}</td>
                  <td>{t.priority}</td>
                  <td>
                    {t.dueDate ? dayjs(t.dueDate).format("DD MMM") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ACTIVITY FEED */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Activity Timeline</h2>

            {/* FILTER BUTTONS */}
            <div className="flex gap-2">
              {["all", "task", "comment", "workflow", "mine"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-sm border ${
                    filter === f
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {f === "all"
                    ? "All"
                    : f === "task"
                    ? "Tasks"
                    : f === "comment"
                    ? "Comments"
                    : f === "workflow"
                    ? "Workflow"
                    : "My Activity"}
                </button>
              ))}
            </div>
          </div>

          {/* FILTERED DATA */}
          {activity.length === 0 && (
            <p className="text-gray-500">No recent activity.</p>
          )}

          <ul className="space-y-4">
            {activity
              .filter((a) => {
                const action = a.action.toLowerCase() || "";

                if (filter === "mine") {
                  return a.user?._id === user?._id;
                }
                
                if (filter === "task") {
                  return (
                    action.includes("task_created") ||
                    action.includes("task_updated") ||
                    action.includes("task_deleted") ||
                    action.includes("task_completed") ||
                    action.includes("task_moved")
                  );
                }
                if (filter === "comment") {
                  return action.includes("comment");
                }
                if (filter === "workflow") {
                  return action.includes("status_changed");
                }
                return true; // all
              })
              .map((a) => {
                // icon + color
                let icon = "📝";
                let color = "text-gray-700";

                if (a.action.includes("created")) {
                  icon = "➕";
                  color = "text-blue-600";
                } else if (a.action.includes("completed")) {
                  icon = "✔️";
                  color = "text-green-600";
                } else if (a.action.includes("updated")) {
                  icon = "✏️";
                  color = "text-yellow-600";
                } else if (a.action.includes("deleted")) {
                  icon = "🗑️";
                  color = "text-red-600";
                } else if (a.action.includes("moved")) {
                  icon = "🔄";
                  color = "text-purple-600";
                } else if (a.action.includes("comment")) {
                  icon = "💬";
                  color = "text-teal-600";
                }

                return (
                  <li
                    key={a._id}
                    className="border-l-4 border-gray-300 pl-4 py-2 relative"
                  >
                    <span className="absolute w-3 h-3 bg-gray-400 rounded-full -left-1.5 top-3"></span>

                    <div className={`flex items-start gap-3 ${color}`}>
                      <span className="text-xl">{icon}</span>

                      <div>
                        <p className="font-medium">
                          {a.user?.name || "Someone"} {a.action}
                        </p>

                        {a.details && (
                          <p className="text-gray-500 text-sm mt-1">{a.details}</p>
                        )}

                        <p className="text-gray-400 text-xs mt-1">
                          {dayjs(a.createdAt).format("DD MMM YYYY • HH:mm")}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------------- REUSABLE SUMMARY CARD ---------------- */

function SummaryCard({ title, value, color }) {
  const colorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div className="p-5 bg-white rounded-xl shadow flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${colorMap[color]}`} />
      <div>
        <div className="text-gray-500 text-sm">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
