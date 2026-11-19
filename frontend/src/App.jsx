import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SubjectDetail from "./pages/SubjectDetail.jsx";
import Notes from "./pages/Notes.jsx";
import Timetable from "./pages/Timetable.jsx";

function Workspace() {
  const [addSubject, setAddSubject] = useState(null);
  return <Layout onAddSubject={addSubject} dashboardSetter={setAddSubject} />;
}

export default function App() {
  return <ToastProvider><Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Workspace />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="subject/:id" element={<SubjectDetail />} />
        <Route path="notes" element={<Notes />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Route>
  </Routes></ToastProvider>;
}
