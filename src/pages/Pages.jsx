import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/AuthProvider";
import PageHeader from "../components/PageHeader";
import { ArrowUpRight, BookOpen, ClipboardList, Trophy, Users, FileText, Bell, Target, Clock3, CheckCircle2, Search, Plus, RefreshCw } from "lucide-react";

const categories = ["RRB NTPC", "Group D", "ALP", "Technician", "JE", "RPF Constable", "RPF SI"];

function EmptyState({ title = "Nothing here yet", text = "Content will appear here once it is added by the administrator." }) {
  return <div className="empty-state"><div className="empty-icon"><FileText/></div><b>{title}</b><p>{text}</p></div>;
}
function Stat({ icon: Icon, label, value, tone = "" }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>;
}
function useRows(table, filters = []) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true); setError("");
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });
    filters.forEach(([col, op, val]) => { q = q[op](col, val); });
    const { data, error } = await q;
    if (error) setError(error.message); else setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [table]);
  return { rows, loading, error, reload: load };
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const { rows: tests } = useRows("tests", [["is_published","eq",true]]);
  const { rows: notices } = useRows("announcements", [["is_published","eq",true]]);
  const { rows: results } = useRows("results");
  return <>
    <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : " back"}`} description="Your preparation journey, all in one place."/>
    <div className="welcome-banner"><div><div className="eyebrow light">STAY CONSISTENT. KEEP IMPROVING.</div><h2>Your next goal is within reach.</h2><p>Choose a test, build your confidence and track your progress.</p><Link className="btn btn-white" to="/app/tests">Explore mock tests <ArrowUpRight size={16}/></Link></div><div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="banner-book"><BookOpen size={58}/></div></div></div>
    <div className="stats-grid"><Stat icon={ClipboardList} label="Available tests" value={tests.length}/><Stat icon={Trophy} label="Tests attempted" value={results.length}/><Stat icon={Target} label="Average score" value={results.length ? `${Math.round(results.reduce((a,r)=>a+Number(r.percentage||0),0)/results.length)}%` : "—"}/><Stat icon={Bell} label="Announcements" value={notices.length}/></div>
    <div className="content-grid"><div className="panel"><div className="panel-heading"><div><h3>Explore exam categories</h3><p>Choose your target railway examination.</p></div><Link to="/app/categories">View all <ArrowUpRight size={15}/></Link></div><div className="category-grid">{categories.slice(0,4).map((c,i)=><Link className="category-tile" to="/app/tests" key={c}><div className={`category-symbol c${i}`}><BookOpen/></div><b>{c}</b><span>Explore preparation <ArrowUpRight size={13}/></span></Link>)}</div></div><div className="panel"><div className="panel-heading"><div><h3>Latest announcements</h3><p>Updates from your institute.</p></div><Link to="/app/announcements">See all</Link></div>{notices.slice(0,3).length ? notices.slice(0,3).map(n=><div className="notice-line" key={n.id}><span className="notice-dot"/><div><b>{n.title}</b><small>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}</small></div></div>) : <EmptyState title="No announcements yet"/>}</div></div>
  </>;
}

export function Categories() {
  return <><PageHeader title="Exam categories" description="Explore preparation resources for your target railway examination."/><div className="category-large-grid">{categories.map((c,i)=><Link to="/app/tests" className="category-large" key={c}><div className={`category-symbol c${i%4}`}><BookOpen/></div><div><h3>{c}</h3><p>Mock tests and previous year papers</p></div><ArrowUpRight/></Link>)}</div></>;
}

export function TestList({ pyq = false, admin = false }) {
  const table = pyq ? "pyq_papers" : "tests";
  const filters = admin ? [] : [["is_published","eq",true]];
  const { rows, loading, error, reload } = useRows(table, filters);
  const [query, setQuery] = useState("");
  const visible = rows.filter(r => `${r.title} ${r.category}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow={admin ? "ADMIN WORKSPACE" : "PREPARATION"} title={admin ? (pyq ? "PYQ management" : "Test management") : (pyq ? "Previous year papers" : "Mock tests")} description={admin ? "Create and manage exam content for students." : (pyq ? "Practice with previous year question papers." : "Build exam readiness with structured mock tests.")} action={admin ? <button className="btn btn-primary" onClick={()=>alert("Content creation form will be enabled after database setup and admin workflow implementation.")}><Plus size={16}/> Add new</button> : null}/><div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search by title or category" value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="btn btn-outline" onClick={reload}><RefreshCw size={15}/> Refresh</button></div>{error && <div className="inline-message">{error}</div>}{loading ? <div className="loading-line">Loading content...</div> : visible.length ? <div className="data-card-list">{visible.map(item=><div className="data-row" key={item.id}><div className="row-icon"><FileText/></div><div className="row-main"><b>{item.title}</b><small>{item.category || "General"} · {item.duration_minutes || "—"} min</small></div><span className={`pill ${item.is_published ? "pill-green" : "pill-gray"}`}>{item.is_published ? "Published" : "Draft"}</span>{!pyq && !admin && <Link className="btn btn-primary btn-small" to={`/app/test/${item.id}`}>View test</Link>}</div>)}</div> : <EmptyState title={pyq ? "No papers available" : "No tests available"} text="Published content will appear here when it is added by the administrator."/>}</>;
}

export function TakeTest() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [t, q] = await Promise.all([
        supabase.from("tests").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("test_id", id).order("position")
      ]);
      if (t.error) setMessage(t.error.message); else { setTest(t.data); setSeconds((t.data.duration_minutes || 30) * 60); }
      if (!q.error) setQuestions(q.data || []); else setMessage(q.error.message);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!started || seconds <= 0) return;
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [started, seconds > 0]);

  const current = questions[index];
  function choose(value) { setAnswers(a => ({ ...a, [current.id]: value })); }
  async function submit() {
    if (!supabase || !user) { setMessage("Please sign in to submit this test."); return; }
    let correct = 0, wrong = 0, attempted = 0, total = 0;
    questions.forEach(q => {
      total += Number(q.marks || test?.positive_marks || 1);
      const answer = answers[q.id];
      if (answer) { attempted++; if (answer === q.correct_option) correct++; else wrong++; }
    });
    const positive = Number(test?.positive_marks || 1);
    const negative = Number(test?.negative_marks || 0);
    const score = correct * positive - wrong * negative;
    const percentage = total ? Math.max(0, Math.round((score / total) * 10000) / 100) : 0;
    const { error } = await supabase.from("results").insert({
      student_id: user.id, test_id: id, attempted_count: attempted,
      correct_count: correct, wrong_count: wrong, unattempted_count: questions.length - attempted,
      total_marks: total, score, percentage, answers
    });
    if (error) setMessage(error.message);
    else navigate("/app/results");
  }

  if (loading) return <div className="loading-line">Loading test...</div>;
  if (!test) return <><PageHeader title="Test unavailable"/><EmptyState title="Test could not be loaded" text={message || "Check that the test exists and is published."}/></>;
  if (!started) return <><PageHeader title={test.title} description="Review the instructions before starting your test."/><div className="panel instructions"><h3>Test instructions</h3><ul><li>Each question has four options. Select the most appropriate answer.</li><li>Use the question palette to navigate between questions.</li><li>You can mark a question for review and change your answer before submission.</li><li>The test will be submitted when the timer reaches zero only after you confirm submission.</li></ul><div className="instruction-stats"><span><Clock3/> {test.duration_minutes} minutes</span><span><FileText/> {questions.length} questions</span><span><Target/> +{test.positive_marks ?? 1} / −{test.negative_marks ?? 0} marks</span></div><button className="btn btn-primary" onClick={()=>setStarted(true)}>Start test <ArrowUpRight size={16}/></button></div></>;
  if (!questions.length) return <EmptyState title="Questions are not available" text="Please contact the administrator."/>;

  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  return <div className="test-layout"><div className="test-main"><div className="test-top"><div><div className="eyebrow">MOCK TEST</div><h2>{test.title}</h2></div><div className="timer"><Clock3/> {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div></div><div className="question-card"><div className="question-meta"><span>Question {index+1} of {questions.length}</span><span>{test.language || "Bilingual"}</span></div><h3>{current.question_text}</h3><div className="options">{["A","B","C","D"].map(opt=><button key={opt} className={`option ${answers[current.id]===opt ? "selected" : ""}`} onClick={()=>choose(opt)}><span>{opt}</span>{current[`option_${opt.toLowerCase()}`]}</button>)}</div><div className="question-actions"><button className="btn btn-outline" onClick={()=>setAnswers(a=>({...a,[current.id]:null}))}>Clear response</button><button className={`btn ${marked[current.id] ? "btn-warning" : "btn-outline"}`} onClick={()=>setMarked(m=>({...m,[current.id]:!m[current.id]}))}>Mark for review</button><div className="push"/><button className="btn btn-outline" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><button className="btn btn-primary" onClick={()=>setIndex(i=>Math.min(questions.length-1,i+1))}>Next</button></div></div><button className="btn btn-primary submit-test" onClick={()=>{if(window.confirm("Are you sure you want to submit this test?")) submit();}}>Submit test</button>{message && <div className="inline-message">{message}</div>}</div><aside className="palette-card"><h3>Question palette</h3><div className="palette-legend"><span><i className="legend-dot answered"/> Answered</span><span><i className="legend-dot review"/> Review</span></div><div className="palette">{questions.map((q,i)=><button key={q.id} className={`${answers[q.id] ? "answered" : ""} ${marked[q.id] ? "review" : ""} ${index===i ? "current" : ""}`} onClick={()=>setIndex(i)}>{i+1}</button>)}</div><div className="palette-summary">{Object.values(answers).filter(Boolean).length} answered · {questions.length-Object.values(answers).filter(Boolean).length} unanswered</div></aside></div>;
}

export function Results() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      if (!supabase || !user) { setLoading(false); return; }
      const { data } = await supabase.from("results").select("*, tests(title, category)").eq("student_id", user.id).order("created_at",{ascending:false});
      setRows(data || []); setLoading(false);
    } load();
  }, [user]);
  return <><PageHeader title="Your results" description="Review your test attempts and monitor your progress."/><div className="stats-grid"><Stat icon={ClipboardList} label="Total attempts" value={rows.length}/><Stat icon={CheckCircle2} label="Questions correct" value={rows.reduce((a,r)=>a+Number(r.correct_count||0),0)}/><Stat icon={Target} label="Average accuracy" value={rows.length ? `${Math.round(rows.reduce((a,r)=>a+Number(r.percentage||0),0)/rows.length)}%` : "—"}/></div>{loading ? <div className="loading-line">Loading results...</div> : rows.length ? <div className="data-card-list">{rows.map(r=><div className="data-row" key={r.id}><div className="row-icon"><Trophy/></div><div className="row-main"><b>{r.tests?.title || "Test attempt"}</b><small>{new Date(r.created_at).toLocaleString()} · {r.correct_count} correct · {r.wrong_count} wrong · {r.unattempted_count} unattempted</small></div><div className="result-score"><b>{r.score}</b><small>{r.percentage}%</small></div></div>)}</div> : <EmptyState title="No results yet" text="Complete your first mock test to see your score and analysis here."/>}</>;
}

export function Performance() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  useEffect(() => { if (supabase && user) supabase.from("results").select("*").eq("student_id",user.id).order("created_at").then(({data})=>setRows(data||[])); },[user]);
  return <><PageHeader title="Performance" description="Understand your progress across test attempts."/><div className="stats-grid"><Stat icon={Trophy} label="Tests completed" value={rows.length}/><Stat icon={Target} label="Best score" value={rows.length ? Math.max(...rows.map(r=>Number(r.percentage||0)))+"%" : "—"}/><Stat icon={ChartNoAxesCombined} label="Latest score" value={rows.length ? rows[rows.length-1].percentage+"%" : "—"}/></div><div className="panel"><h3>Attempt history</h3>{rows.length ? <div className="data-card-list">{rows.map(r=><div className="data-row" key={r.id}><div className="row-main"><b>{new Date(r.created_at).toLocaleDateString()}</b><small>{r.correct_count} correct / {r.wrong_count} wrong / {r.unattempted_count} unattempted</small></div><b>{r.percentage}%</b></div>)}</div> : <EmptyState title="Your progress will appear here"/>}</div></>;
}


export function Announcements() {
  const { rows, loading } = useRows("announcements", [["is_published", "eq", true]]);

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Important updates and notices."
      />

      {loading ? (
        <div className="loading-line">Loading announcements...</div>
      ) : rows.length > 0 ? (
        <div className="data-card-list">
          {rows.map((n) => (
            <article className="announcement-card" key={n.id}>
              <div className="notice-dot" />
              <div>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <small>
                  {new Date(n.created_at).toLocaleDateString()}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No announcements yet" />
      )}
    </>
  );
}

export function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [name,setName] = useState(profile?.full_name || "");
  const [phone,setPhone] = useState(profile?.phone || "");
  const [preference,setPreference] = useState(profile?.exam_preference || "RRB NTPC");
  const [message,setMessage] = useState("");
  useEffect(()=>{setName(profile?.full_name||"");setPhone(profile?.phone||"");setPreference(profile?.exam_preference||"RRB NTPC");},[profile]);
  async function save(e){e.preventDefault();const {error}=await supabase.from("profiles").update({full_name:name,phone,exam_preference:preference}).eq("id",user.id);setMessage(error?.message||"Profile updated successfully.");if(!error)refreshProfile();}
  return <><PageHeader title="Profile" description="Manage your personal details and exam preference."/><form className="panel profile-form" onSubmit={save}><label>Full name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Email address<input value={user?.email||""} disabled/></label><label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number"/></label><label>Exam preference<select value={preference} onChange={e=>setPreference(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>{message&&<div className="inline-message">{message}</div>}<button className="btn btn-primary">Save changes</button></form></>;
}

export function Support() {
  const { user } = useAuth();
  const [subject,setSubject]=useState(""); const [details,setDetails]=useState(""); const [message,setMessage]=useState("");
  async function send(e){e.preventDefault();const {error}=await supabase.from("support_tickets").insert({user_id:user.id,subject,details});setMessage(error?.message||"Your support request has been submitted.");if(!error){setSubject("");setDetails("");}}
  return <><PageHeader title="Help & Support" description="Tell us about an issue and our team will review it."/><form className="panel profile-form" onSubmit={send}><label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} required placeholder="What do you need help with?"/></label><label>Describe the problem<textarea value={details} onChange={e=>setDetails(e.target.value)} rows="5" required placeholder="Share details so we can help you."/></label>{message&&<div className="inline-message">{message}</div>}<button className="btn btn-primary">Submit request</button></form></>;
}

export function Account() {
  const [message,setMessage]=useState("");
  async function reset(){const email=window.prompt("Enter your account email address");if(!email)return;const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/reset-password"});setMessage(error?.message||"Password reset instructions have been sent if the account exists.");}
  async function deletion(){const reason=window.prompt("Optional: tell us why you want to delete your account");if(reason===null)return;const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from("account_deletion_requests").insert({user_id:user.id,reason});setMessage(error?.message||"Your account deletion request has been submitted for review.");}
  return <><PageHeader title="Account settings" description="Manage your account security and access."/><div className="panel settings-list"><div><div><b>Password reset</b><p>Receive a secure password reset link by email.</p></div><button className="btn btn-outline" onClick={reset}>Send reset link</button></div><div><div><b>Account deletion request</b><p>Submit a request to have your account reviewed for deletion.</p></div><button className="btn btn-outline danger-outline" onClick={deletion}>Request deletion</button></div>{message&&<div className="inline-message">{message}</div>}</div></>;
}

export function AdminDashboard() {
  const { rows: students }=useRows("profiles");
  const { rows: tests }=useRows("tests");
  const { rows: results }=useRows("results");
  return <><PageHeader eyebrow="ADMIN WORKSPACE" title="Admin dashboard" description="Monitor your platform and manage exam preparation content."/><div className="stats-grid"><Stat icon={Users} label="Registered profiles" value={students.length}/><Stat icon={ClipboardList} label="Total tests" value={tests.length}/><Stat icon={Trophy} label="Test attempts" value={results.length}/><Stat icon={BookOpen} label="Exam categories" value={categories.length}/></div><div className="content-grid"><div className="panel"><h3>Content management</h3><p className="muted">Manage the resources available to students.</p><div className="admin-shortcuts"><Link to="/admin/tests"><ClipboardList/> Manage tests <ArrowUpRight/></Link><Link to="/admin/questions"><FileText/> Manage questions <ArrowUpRight/></Link><Link to="/admin/pyq"><BookOpen/> Manage PYQs <ArrowUpRight/></Link><Link to="/admin/announcements"><Bell/> Publish announcements <ArrowUpRight/></Link></div></div><div className="panel"><h3>Important setup note</h3><p className="muted">Admin access is granted only through a trusted database-side role change. Never allow public signup to assign the admin role.</p><div className="security-note"> <CheckCircle2/> Role-based access is enforced by database policies in the supplied SQL setup.</div></div></div></>;
}

export function AdminGeneric({ title, table, columns = ["title","created_at"] }) {
  const { rows, loading, error, reload }=useRows(table);
  return <><PageHeader eyebrow="ADMIN WORKSPACE" title={title} description="Review records currently stored in Supabase."/><div className="toolbar"><div className="muted">{rows.length} records</div><button className="btn btn-outline" onClick={reload}><RefreshCw size={15}/> Refresh</button></div>{error&&<div className="inline-message">{error}</div>}{loading?<div className="loading-line">Loading records...</div>:rows.length?<div className="data-card-list">{rows.map((r)=><div className="data-row" key={r.id}><div className="row-icon"><FileText/></div><div className="row-main"><b>{r.full_name||r.title||r.email||r.subject||"Record"}</b><small>{columns.filter(c=>r[c]!==undefined).map(c=>`${c.replaceAll("_"," ")}: ${r[c] ?? "—"}`).join(" · ")}</small></div><span className="pill pill-gray">{r.role|| (r.is_published?"Published":"Record")}</span></div>)}</div>:<EmptyState/>}</>;
}

export function ForgotPassword() {
  const [email,setEmail]=useState("");const [message,setMessage]=useState("");
  async function submit(e){e.preventDefault();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/reset-password"});setMessage(error?.message||"If an account exists, password reset instructions have been sent.");}
  return <div className="auth-page simple-auth"><form className="auth-card" onSubmit={submit}><div className="eyebrow">ACCOUNT RECOVERY</div><h2>Reset your password</h2><p className="muted">Enter your account email and we will send a reset link.</p><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>{message&&<div className="inline-message">{message}</div>}<button className="btn btn-primary full-width">Send reset link</button><div className="auth-switch"><Link to="/login">Back to sign in</Link></div></form></div>;
}
