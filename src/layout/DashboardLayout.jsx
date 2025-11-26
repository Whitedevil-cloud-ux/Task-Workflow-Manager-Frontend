import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
