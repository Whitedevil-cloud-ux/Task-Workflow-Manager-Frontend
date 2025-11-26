import NotificationBell from "../components/NotificationBell";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const Navbar = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="h-16 bg-white shadow-md flex items-center justify-between px-6">
      <h2 className="text-xl font-semibold text-gray-700">
        Tasks Manager
      </h2>

      <div className="flex items-center gap-5">
        <NotificationBell />
      </div>
    </div>
  );
};

export default Navbar;
