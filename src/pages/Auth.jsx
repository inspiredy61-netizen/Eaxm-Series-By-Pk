import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { BookOpenCheck, Eye, EyeOff } from "lucide-react";

export default function Auth({ signup = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault(); setMessage("");
    if (!isSupabaseConfigured) { setMessage("Supabase is not configured yet. Follow the project README."); return; }
    setBusy(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setMessage("Account request received. Check your email to verify your address before signing in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app");
      }
    } catch (err) { setMessage(err.message || "Something went wrong."); }
    finally { setBusy(false); }
  }

  return <div className="auth-page"><div className="auth-visual"><div className="auth-brand"><div className="brand-mark">PK</div><b>EXAM SERIES BY PK</b></div><div className="auth-copy"><div className="eyebrow light">YOUR NEXT MILESTONE STARTS HERE</div><h1>Prepare with purpose.<br/><em>Perform with confidence.</em></h1><p>A focused preparation space for your railway exam journey.</p><div className="auth-feature"><BookOpenCheck/> Structured mock tests and previous year papers</div></div><div className="auth-footer">© {new Date().getFullYear()} EXAM SERIES BY PK</div></div>
    <div className="auth-form-wrap"><form className="auth-card" onSubmit={submit}><div className="eyebrow">{signup ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</div><h2>{signup ? "Join the learning community" : "Sign in to your account"}</h2><p className="muted">{signup ? "Create an account to start preparing." : "Enter your details to continue your preparation."}</p>
      {signup && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" required/></label>}
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
      <label>Password<div className="password-wrap"><input type={show ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" minLength={6} required/><button type="button" onClick={()=>setShow(!show)} aria-label="Toggle password visibility">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
      {!signup && <div className="form-row-end"><Link to="/forgot-password">Forgot password?</Link></div>}
      {message && <div className="inline-message">{message}</div>}
      <button className="btn btn-primary full-width" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
      <div className="auth-switch">{signup ? "Already have an account?" : "New to Exam Series?"} <Link to={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></div>
    </form></div></div>;
}
