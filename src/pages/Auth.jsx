import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../components/AuthProvider";
import { BookOpenCheck, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function Auth({ signup = false, adminLogin = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    if (!isSupabaseConfigured) {
      setMessage("Supabase is not configured yet. Follow the project README.");
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setMessage("Account request received. Check your email to verify your address before signing in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        const isAdmin = profile?.role === "admin";

        if (adminLogin && !isAdmin) {
          await supabase.auth.signOut();
          throw new Error("This account does not have administrator access.");
        }

        await refreshProfile();
        navigate(isAdmin ? "/admin" : "/app", { replace: true });
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const heading = signup
    ? "Join the learning community"
    : adminLogin
      ? "Admin sign in"
      : "Sign in to your account";
  const intro = signup
    ? "Create an account to start preparing."
    : adminLogin
      ? "Sign in with your authorized administrator account."
      : "Enter your details to continue your preparation.";

  return <div className="auth-page">
    <div className="auth-visual">
      <div className="auth-brand"><div className="brand-mark">PK</div><b>EXAM SERIES BY PK</b></div>
      <div className="auth-copy">
        <div className="eyebrow light">YOUR NEXT MILESTONE STARTS HERE</div>
        <h1>Prepare with purpose.<br/><em>Perform with confidence.</em></h1>
        <p>A focused preparation space for your railway exam journey.</p>
        <div className="auth-feature">{adminLogin ? <ShieldCheck/> : <BookOpenCheck/>} {adminLogin ? "Secure administrator access" : "Structured mock tests and previous year papers"}</div>
      </div>
      <div className="auth-footer">© {new Date().getFullYear()} EXAM SERIES BY PK</div>
    </div>
    <div className="auth-form-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="eyebrow">{signup ? "CREATE YOUR ACCOUNT" : adminLogin ? "ADMINISTRATOR ACCESS" : "WELCOME BACK"}</div>
        <h2>{heading}</h2>
        <p className="muted">{intro}</p>
        {signup && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required/></label>}
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" required/></label>
        <label>Password<div className="password-wrap"><input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" minLength={6} autoComplete={signup ? "new-password" : "current-password"} required/><button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        {!signup && <div className="form-row-end"><Link to="/forgot-password">Forgot password?</Link></div>}
        {message && <div className="inline-message">{message}</div>}
        <button className="btn btn-primary full-width" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : adminLogin ? "Admin sign in" : "Sign in"}</button>
        <div className="auth-switch">{signup ? <>Already have an account? <Link to="/login">Sign in</Link></> : adminLogin ? <>Student? <Link to="/login">Student login</Link></> : <>New to Exam Series? <Link to="/signup">Create an account</Link></>}</div>
        {!signup && !adminLogin && <div className="auth-switch"><ShieldCheck size={15}/> Administrator? <Link to="/admin-login">Admin login</Link></div>}
      </form>
    </div>
  </div>;
}
