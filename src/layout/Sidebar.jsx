import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  const linkClasses = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition
   ${isActive
      ? "bg-gray-200 text-black"
      : "text-gray-700 hover:bg-gray-200"
   }`;

  return (
    <div className="
      w-64 min-h-screen 
      bg-white text-gray-800
      text-black 
      p-6 shadow-xl 
    ">
      <h1 className="text-2xl font-semibold mb-8 tracking-wide text-black">TaskFlow</h1>

      <nav className="space-y-2">
        <NavLink to="/dashboard" className={linkClasses}>Dashboard</NavLink>
        <NavLink to="/tasks" className={linkClasses}>Tasks</NavLink>
        <NavLink to="/workflow" className={linkClasses}>Workflow</NavLink>
        <NavLink to="/profile" className={linkClasses}>Profile</NavLink>
        <NavLink to="/kanban" className={linkClasses}>Kanban</NavLink>
      </nav>

      <button
        onClick={handleLogout}
        className="mt-10 w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-medium transition"
      >
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
