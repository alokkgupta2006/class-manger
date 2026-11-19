import { BookOpenCheck, CalendarRange, LayoutDashboard, LogOut, Moon, NotebookPen, Plus, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "./Toast.jsx";

export default function Layout({ onAddSubject, dashboardSetter }) {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const navigate = useNavigate();
  const toast = useToast();
  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  const signOut = async () => {
    try { await logout(); navigate("/login"); }
    catch (error) { toast(error.message, "error"); }
  };
  const addSubject = () => {
    if (onAddSubject) onAddSubject();
    else navigate("/dashboard", { state: { openSubjectModal: true } });
  };
  const links = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard", label: "My subjects", icon: BookOpenCheck },
    { to: "/timetable", label: "Timetable", icon: CalendarRange },
    { to: "/notes", label: "Daily notes", icon: NotebookPen }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand"><span className="brand-mark"><BookOpenCheck size={19} /></span><span>attendly<span className="brand-period">.</span></span></NavLink>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }, index) => <NavLink key={label} to={to} end={index < 2} className={({ isActive }) => `nav-link ${isActive && index !== 1 ? "active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}
          <button className="nav-link" onClick={addSubject}><Plus size={18} /><span>Add subject</span><span className="shortcut">+</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={16} /> : <Moon size={16} />}<span>{dark ? "Light mode" : "Dark mode"}</span><i className={dark ? "on" : ""} /></button>
          <div className="profile-card"><span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || <UserRound size={17} />}</span><div className="profile-info"><strong>{user?.name}</strong><span>{user?.email}</span></div><button className="icon-button logout-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></div>
        </div>
      </aside>
      <div className="mobile-header"><NavLink to="/dashboard" className="brand"><span className="brand-mark"><BookOpenCheck size={19} /></span><span>attendly<span className="brand-period">.</span></span></NavLink><div className="mobile-header-actions"><button className="icon-button" onClick={() => setDark((value) => !value)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button className="button button-primary button-small" onClick={addSubject}><Plus size={15} /> Add</button></div></div>
      <main className="main-content"><Outlet context={dashboardSetter} /></main>
      <nav className="mobile-nav"><NavLink to="/dashboard"><LayoutDashboard size={19} /><span>Overview</span></NavLink><NavLink to="/timetable"><CalendarRange size={19} /><span>Timetable</span></NavLink><NavLink to="/notes"><NotebookPen size={19} /><span>Notes</span></NavLink><button onClick={signOut}><LogOut size={19} /><span>Sign out</span></button></nav>
    </div>
  );
}
