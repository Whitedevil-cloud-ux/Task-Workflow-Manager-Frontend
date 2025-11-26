import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
    role: "user",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/signup", form);
      if (res.data.success) {
        alert("Signup successful!");
        navigate("/login");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-600">
      <div className="bg-white/20 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-[380px] border border-white/30">

        <h2 className="text-3xl font-bold text-white text-center mb-6">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full p-3 bg-white/30 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
            className="w-full p-3 bg-white/30 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-3 bg-white/30 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white"
            required
          />

          <input
            type="text"
            name="avatar"
            placeholder="Avatar URL (optional)"
            onChange={handleChange}
            className="w-full p-3 bg-white/30 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/30 hover:bg-white/40 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>

        <p className="text-center text-white/80 mt-3">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="cursor-pointer font-semibold text-white hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
