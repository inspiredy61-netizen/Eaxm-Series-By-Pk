import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, ClipboardList, FileText, Trophy, ChartNoAxesCombined, Bell, CircleHelp, UserRound, Settings, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useState } from "react";

const studentLinks = [
  ["/app", "Dashboard", LayoutDashboard],
  ["/app/categories", "Exam Categories", BookOpen],
  ["/app/tests", "Mock Tests", ClipboardList],
  ["/app/pyq", "Previous Year Papers", FileText],
  ["/app/results", "Results", Trophy],
  ["/app/performance", "Performance", ChartNoAxesCombined],
  ["/app/announcements", "Announcements", Bell],
  ["/app/support", "Help & Support", CircleHelp],
  ["/app/profile", "Profile", UserRound],
  ["/app/account", "Account", Settings]
];
const adminLinks = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/students", "Student Management", UserRound],
  ["/admin/categories", "Category Management", BookOpen],
  ["/admin/tests", "Test Management", ClipboardList],
  ["/admin/questions", "Question Management", FileText],
  ["/admin/pyq", "PYQ Management", FileText],
  ["/admin/results", "Results", Trophy],
  ["/admin/announcements", "Announcements", Bell],
  ["/admin/profile", "Admin Profile", Settings]
];

export default function Layout({ admin = false }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = admin ? adminLinks : studentLinks;
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark">PK</div><div><b>EXAM SERIES</b><small>BY PK</small></div><button className="mobile-close" onClick={() => setOpen(false)}><X size={19}/></button></div>
      <div className="nav-label">{admin ? "ADMIN WORKSPACE" : "STUDENT WORKSPACE"}</div>
      <nav>{links.map(([to, label, Icon]) => <NavLink end={to === "/app" || to === "/admin"} key={to} to={to} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{(profile?.full_name || "S").slice(0,1).toUpperCase()}</div><div><b>{profile?.full_name || "Student"}</b><small>{admin ? "Administrator" : "Student account"}</small></div></div><button className="logout" onClick={async () => { await signOut(); navigate("/login"); }}><LogOut size={17}/> Sign out</button></div>
    </aside>
    {open && <button className="scrim" onClick={() => setOpen(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setOpen(true)}><Menu/></button><div className="breadcrumb">EXAM SERIES <span>/</span> {admin ? "ADMIN" : "STUDENT"}</div><div className="topbar-right"><span className="status-dot"/> Online learning portal <div className="avatar small-avatar">{(profile?.full_name || "S").slice(0,1).toUpperCase()}</div></div></header>
      <section className="page-content"><Outlet/></section>
    </main>
  </div>;
}
