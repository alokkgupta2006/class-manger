import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Eye, EyeOff, Moon, ShieldCheck, Sun } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const registering = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (registering) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        className="auth-theme-toggle"
        onClick={() => setDark((value) => !value)}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? <Sun size={17} /> : <Moon size={17} />}
        <span>{dark ? "Light mode" : "Dark mode"}</span>
      </button>
      <section className="auth-aside">
        <Link to="/login" className="brand auth-brand"><span className="brand-mark"><BookOpenCheck size={19} /></span><span>attendly<span className="brand-period">.</span></span></Link>
        <div className="auth-promo"><div className="promo-pill"><span /> YOUR SEMESTER, IN SYNC</div><h1>Show up for<br /><span>your goals.</span></h1><p>A little clarity goes a long way. Keep track of every class, spot patterns, and stay above your target.</p><div className="promo-card"><div className="promo-card-top"><span>This week</span><span className="promo-live"><i /> ON TRACK</span></div><div className="promo-stat">87.5<span>%</span></div><div className="mini-bars">{[48, 68, 55, 82, 61, 93, 73].map((height, index) => <div key={index} style={{ height: `${height}%` }} />)}</div><div className="promo-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div></div>
        <div className="auth-footnote"><ShieldCheck size={15} /> Your data is private and secure.</div>
      </section>
      <section className="auth-main"><div className="auth-form-wrap">
        <div className="auth-mobile-brand"><BookOpenCheck size={19} /> attendly<span>.</span></div>
        <p className="eyebrow">{registering ? "GET STARTED" : "WELCOME BACK"}</p><h2>{registering ? "Create your account" : "Sign in to your account"}</h2><p className="auth-subtitle">{registering ? "Set up your space and make every class count." : "Your semester is right where you left it."}</p>
        <form className="form-stack auth-form" onSubmit={submit}>
          {registering && <label>Full name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" minLength="2" maxLength="80" required /></label>}
          <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@university.edu" required /></label>
          <label>Password<div className="password-wrap"><input type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={registering ? "At least 8 characters" : "Enter your password"} minLength={registering ? 8 : undefined} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Please wait…" : registering ? "Create account" : "Sign in"}<ArrowRight size={17} /></button>
        </form>
        {!registering && <div className="demo-hint"><strong>Want to take a look?</strong><span>Try demo@student.com · Password123!</span></div>}
        <p className="auth-switch">{registering ? "Already have an account?" : "New to Attendly?"} <Link to={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create an account"}</Link></p>
      </div></section>
    </div>
  );
}
