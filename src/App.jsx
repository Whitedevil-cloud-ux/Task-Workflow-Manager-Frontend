import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import KanbanBoard from "./pages/KanbanBoard";
import Workflow from "./pages/Workflow";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
          }
          />

        <Route path="/workflow"
        element={
          <ProtectedRoute>
            <Workflow />
          </ProtectedRoute>
          }
          />


        <Route path="/profile"
        element={
          <ProtectedRoute>
              <Profile />
          </ProtectedRoute>
        }
        />

        <Route path="/kanban"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <KanbanBoard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
