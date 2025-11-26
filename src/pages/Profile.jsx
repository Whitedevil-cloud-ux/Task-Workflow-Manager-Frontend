import { useState, useEffect } from "react";
import api from "../services/api";
import dayjs from "dayjs";
import DashboardLayout from "../layout/DashboardLayout";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    tasks: 0,
    comments: 0,
    completed: 0,
  });

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/me");
      if (res.data?.success) {
        setUser(res.data.user);
        setFormData({
          name: res.data.user.name,
          email: res.data.user.email,
          bio: res.data.user.bio || "",
        });
      }

      const st = await api.get("/users/me/stats");
      if (st.data?.success) setStats(st.data.stats);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setSaving(true);

    try {
      await api.put("/users/update-profile", formData);
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile");
    }

    setSaving(false);
  };

  if (!user) return <DashboardLayout>Loading profile...</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>

        {/* HEADER CARD */}
        <div className="bg-white rounded-xl shadow p-6 flex gap-6 mb-6">
          <div className="relative">
            <img
              src={avatarPreview || user.avatar || "/default-avatar.png"}
              className="w-28 h-28 rounded-full object-cover border"
            />
            <label className="absolute bottom-1 right-1 bg-indigo-600 text-white px-2 py-1 text-xs rounded cursor-pointer">
              Change
              <input type="file" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-500 mt-1">
              Joined {dayjs(user.createdAt).format("DD MMM YYYY")}
            </p>

            <p className="mt-3 text-gray-700">
              {formData.bio || "No bio added yet."}
            </p>
          </div>

          <button
            onClick={() => setEditMode(true)}
            className="h-10 px-4 bg-indigo-600 text-white rounded-lg"
          >
            Edit Profile
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Tasks</h3>
            <p className="text-3xl font-semibold">{stats.tasks}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 text-sm">Comments</h3>
            <p className="text-3xl font-semibold">{stats.comments}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 text-sm">Completed Tasks</h3>
            <p className="text-3xl font-semibold">{stats.completed}</p>
          </div>
        </div>

        {/* EDIT MODAL */}
        {editMode && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[450px] shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

              <div className="space-y-3">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInput}
                  className="w-full p-3 border rounded"
                  placeholder="Full name"
                />

                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInput}
                  className="w-full p-3 border rounded"
                  placeholder="Email"
                />

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInput}
                  className="w-full p-3 border rounded"
                  placeholder="Write something about yourself"
                />
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
