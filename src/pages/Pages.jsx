import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/AuthProvider";
import PageHeader from "../components/PageHeader";
import { ArrowUpRight, BookOpen, ClipboardList, Trophy, Users, FileText, Bell, Target, Clock3, CheckCircle2, Search, Plus, RefreshCw, Pencil, Trash2, X, Save, BarChart3 } from "lucide-react";


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

// Student-facing category lists always come from Supabase. Hidden categories stay out
// of the student portal, while older rows with a null is_active value remain visible.
function useStudentCategories() {
  const result = useRows("categories");
  const rows = result.rows.filter(category => category.is_active !== false);
  return { ...result, rows };
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const { rows: tests } = useRows("tests", [["is_published","eq",true]]);
  const { rows: notices } = useRows("announcements", [["is_published","eq",true]]);
  const { rows: results } = useRows("results");
  const { rows: examCategories, loading: categoriesLoading, error: categoriesError } = useStudentCategories();
  return <>
    <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : " back"}`} description="Your preparation journey, all in one place."/>
    <div className="welcome-banner"><div><div className="eyebrow light">STAY CONSISTENT. KEEP IMPROVING.</div><h2>Your next goal is within reach.</h2><p>Choose a test, build your confidence and track your progress.</p><Link className="btn btn-white" to="/app/tests">Explore mock tests <ArrowUpRight size={16}/></Link></div><div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="banner-book"><BookOpen size={58}/></div></div></div>
    <div className="stats-grid"><Stat icon={ClipboardList} label="Available tests" value={tests.length}/><Stat icon={Trophy} label="Tests attempted" value={results.length}/><Stat icon={Target} label="Average score" value={results.length ? `${Math.round(results.reduce((a,r)=>a+Number(r.percentage||0),0)/results.length)}%` : "—"}/><Stat icon={Bell} label="Announcements" value={notices.length}/></div>
    <div className="content-grid"><div className="panel"><div className="panel-heading"><div><h3>Explore exam categories</h3><p>Choose your target railway examination.</p></div><Link to="/app/categories">View all <ArrowUpRight size={15}/></Link></div><div className="category-grid">{examCategories.slice(0,4).map((c,i)=><Link className="category-tile" to={`/app/tests?category=${encodeURIComponent(c.name)}`} key={c.id}><div className={`category-symbol c${i%4}`}><BookOpen/></div><b>{c.name}</b><span>Explore preparation <ArrowUpRight size={13}/></span></Link>)}</div>{categoriesLoading && <div className="muted">Loading categories...</div>}{categoriesError && <div className="inline-message">Could not load categories: {categoriesError}</div>}{!categoriesLoading && !categoriesError && examCategories.length===0 && <EmptyState title="No exam categories available"/>}</div><div className="panel"><div className="panel-heading"><div><h3>Latest announcements</h3><p>Updates from your institute.</p></div><Link to="/app/announcements">See all</Link></div>{notices.slice(0,3).length ? notices.slice(0,3).map(n=><div className="notice-line" key={n.id}><span className="notice-dot"/><div><b>{n.title}</b><small>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}</small></div></div>) : <EmptyState title="No announcements yet"/>}</div></div>
  </>;
}

export function Categories() {
  const { rows, loading, error } = useStudentCategories();
  return <><PageHeader title="Exam categories" description="Explore preparation resources for your target railway examination."/>{error && <div className="inline-message">Could not load categories: {error}</div>}{loading ? <div className="loading-line">Loading categories...</div> : rows.length ? <div className="category-large-grid">{rows.map((category,i)=><Link to={`/app/tests?category=${encodeURIComponent(category.name)}`} className="category-large" key={category.id}><div className={`category-symbol c${i%4}`}><BookOpen/></div><div><h3>{category.name}</h3><p>Mock tests and previous year papers</p></div><ArrowUpRight/></Link>)}</div> : <EmptyState title="No exam categories available" text="New categories will appear here when they are added by the administrator."/>}</>;
}

export function TestList({ pyq = false, admin = false }) {
  const table = pyq ? "pyq_papers" : "tests";
  const filters = admin ? [] : [["is_published","eq",true]];
  const { rows, loading, error, reload } = useRows(table, filters);
  const [query, setQuery] = useState("");
  const [searchParams] = useSearchParams();
  const selectedCategory = admin ? null : searchParams.get("category");
  const visible = rows.filter(r => {
    const matchesQuery = `${r.title || ""} ${r.category || ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = !selectedCategory ||
      (r.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase();
    return matchesQuery && matchesCategory;
  });
  return <><PageHeader eyebrow={admin ? "ADMIN WORKSPACE" : "PREPARATION"} title={admin ? (pyq ? "PYQ management" : "Test management") : (pyq ? "Previous year papers" : (selectedCategory ? `${selectedCategory} Mock Tests` : "Mock tests"))} description={admin ? "Create and manage exam content for students." : (pyq ? "Practice with previous year question papers." : "Build exam readiness with structured mock tests.")} action={admin ? <button className="btn btn-primary" onClick={()=>alert("Content creation form will be enabled after database setup and admin workflow implementation.")}><Plus size={16}/> Add new</button> : null}/><div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search by title or category" value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="btn btn-outline" onClick={reload}><RefreshCw size={15}/> Refresh</button></div>{error && <div className="inline-message">{error}</div>}{loading ? <div className="loading-line">Loading content...</div> : visible.length ? <div className="data-card-list">{visible.map(item=><div className="data-row" key={item.id}><div className="row-icon"><FileText/></div><div className="row-main"><b>{item.title}</b><small>{item.category || "General"} · {item.duration_minutes || "—"} min</small></div><span className={`pill ${item.is_published ? "pill-green" : "pill-gray"}`}>{item.is_published ? "Published" : "Draft"}</span>{!pyq && !admin && <Link className="btn btn-primary btn-small" to={`/app/test/${item.id}`}>View test</Link>}</div>)}</div> : <EmptyState title={pyq ? "No papers available" : "No tests available"} text={selectedCategory ? `No published tests are available in ${selectedCategory} yet.` : "Published content will appear here when it is added by the administrator."}/>}</>;
}

const testText = {
  en: { instructionsTitle:"Test instructions", instructions:["Each question has four options. Select the most appropriate answer.","Use the question palette to navigate between questions.","You can mark a question for review and change your answer before submission.","When the timer reaches zero, the test will be submitted automatically."], start:"Start test", question:"Question", of:"of", clear:"Clear response", mark:"Mark for review", marked:"Marked for review", previous:"Previous", next:"Next", submit:"Submit test", palette:"Question palette", answered:"Answered", review:"Review", unanswered:"Unanswered", confirm:"Are you sure you want to submit this test?", language:"Question language", english:"English", hindi:"हिन्दी", bilingual:"Bilingual", timeUp:"Time is up. Your test is being submitted." },
  hi: { instructionsTitle:"परीक्षा के निर्देश", instructions:["प्रत्येक प्रश्न में चार विकल्प हैं। सबसे उपयुक्त उत्तर चुनें।","प्रश्नों के बीच जाने के लिए प्रश्न सूची का उपयोग करें।","आप किसी प्रश्न को समीक्षा के लिए चिह्नित कर सकते हैं और जमा करने से पहले उत्तर बदल सकते हैं।","समय समाप्त होने पर परीक्षा अपने आप जमा हो जाएगी।"], start:"परीक्षा शुरू करें", question:"प्रश्न", of:"में से", clear:"उत्तर हटाएँ", mark:"समीक्षा के लिए चिह्नित करें", marked:"समीक्षा के लिए चिह्नित", previous:"पिछला", next:"अगला", submit:"परीक्षा जमा करें", palette:"प्रश्न सूची", answered:"उत्तर दिया", review:"समीक्षा", unanswered:"अनुत्तरित", confirm:"क्या आप वाकई परीक्षा जमा करना चाहते हैं?", language:"प्रश्नों की भाषा", english:"English", hindi:"हिन्दी", bilingual:"द्विभाषी", timeUp:"समय समाप्त हो गया है। आपकी परीक्षा जमा की जा रही है।" }
};

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
  const [language, setLanguage] = useState("en");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = testText[language === "hi" ? "hi" : "en"];

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [tResult, qResult] = await Promise.all([
        supabase.from("tests").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("test_id", id).order("position")
      ]);
      if (tResult.error) setMessage(tResult.error.message);
      else { setTest(tResult.data); setSeconds((tResult.data.duration_minutes || 30) * 60); }
      if (qResult.error) setMessage(qResult.error.message); else setQuestions(qResult.data || []);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!started || seconds <= 0 || submitting) return;
    const timer = setTimeout(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [started, seconds, submitting]);

  const current = questions[index];
  function choose(value) { setAnswers(a => ({ ...a, [current.id]: value })); }

  async function submit(isTimeout = false) {
    if (submitting) return;
    if (!supabase || !user) { setMessage("Please sign in to submit this test."); return; }
    setSubmitting(true); setMessage("");
    let correct = 0, wrong = 0, attempted = 0, total = 0;
    questions.forEach(q => {
      total += Number(q.marks || test?.positive_marks || 1);
      const answer = answers[q.id];
      if (answer) { attempted++; if (answer === q.correct_option) correct++; else wrong++; }
    });
    const positive = Number(test?.positive_marks ?? 1);
    const negative = Number(test?.negative_marks ?? 0);
    const score = correct * positive - wrong * negative;
    const percentage = total ? Math.round((score / total) * 10000) / 100 : 0;
    const { data, error } = await supabase.from("results").insert({
      student_id: user.id, test_id: id, attempted_count: attempted,
      correct_count: correct, wrong_count: wrong, unattempted_count: questions.length - attempted,
      total_marks: total, score, percentage, answers
    }).select("id").single();
    setSubmitting(false);
    if (error) setMessage(error.message);
    else navigate(`/app/result/${data.id}`, { replace: true, state: { timeout: isTimeout } });
  }

  useEffect(() => {
    if (started && seconds === 0 && questions.length && !submitting) submit(true);
  }, [started, seconds]);

  if (loading) return <div className="loading-line">Loading test...</div>;
  if (!test) return <><PageHeader title="Test unavailable"/><EmptyState title="Test could not be loaded" text={message || "Check that the test exists and is published."}/></>;
  if (!questions.length) return <EmptyState title="Questions are not available" text="Please contact the administrator."/>;
  if (!started) return <>
    <PageHeader title={test.title} description="Review the instructions before starting your test."/>
    <div className="panel instructions">
      <div className="language-picker"><label htmlFor="test-language">{t.language}</label><select id="test-language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">{t.english}</option><option value="hi">{t.hindi}</option><option value="bi">{t.bilingual}</option></select></div>
      <h3>{t.instructionsTitle}</h3><ul>{t.instructions.map((line,i)=><li key={i}>{line}</li>)}</ul>
      <div className="instruction-stats"><span><Clock3/> {test.duration_minutes} minutes</span><span><FileText/> {questions.length} questions</span><span><Target/> +{test.positive_marks ?? 1} / −{test.negative_marks ?? 0} marks</span></div>
      <button className="btn btn-primary" onClick={()=>setStarted(true)}>{t.start} <ArrowUpRight size={16}/></button>
    </div>
  </>;

  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  const bilingual = language === "bi";
  const questionText = language === "hi" ? (current.question_text_hi || current.question_text) : current.question_text;
  const optionText = opt => language === "hi" ? (current[`option_${opt.toLowerCase()}_hi`] || current[`option_${opt.toLowerCase()}`]) : current[`option_${opt.toLowerCase()}`];
  return <div className="test-layout"><div className="test-main">
    <div className="test-top"><div><div className="eyebrow">MOCK TEST</div><h2>{test.title}</h2><label className="active-language">{t.language}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">{t.english}</option><option value="hi">{t.hindi}</option><option value="bi">{t.bilingual}</option></select></label></div><div className="timer"><Clock3/> {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div></div>
    <div className="question-card"><div className="question-meta"><span>{t.question} {index+1} {t.of} {questions.length}</span><span>{bilingual ? "Bilingual" : language === "hi" ? "हिन्दी" : "English"}</span></div>
      <h3>{questionText}</h3>{bilingual && current.question_text_hi && <h3 className="hindi-secondary">{current.question_text_hi}</h3>}
      <div className="options">{["A","B","C","D"].map(opt=><button key={opt} className={`option ${answers[current.id]===opt ? "selected" : ""}`} onClick={()=>choose(opt)}><span>{opt}</span><div>{optionText(opt)}{bilingual && current[`option_${opt.toLowerCase()}_hi`] && <small className="hindi-option">{current[`option_${opt.toLowerCase()}_hi`]}</small>}</div></button>)}</div>
      <div className="question-actions"><button className="btn btn-outline" onClick={()=>setAnswers(a=>({...a,[current.id]:null}))}>{t.clear}</button><button className={`btn ${marked[current.id] ? "btn-warning" : "btn-outline"}`} onClick={()=>setMarked(m=>({...m,[current.id]:!m[current.id]}))}>{marked[current.id] ? t.marked : t.mark}</button><div className="push"/><button className="btn btn-outline" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>{t.previous}</button><button className="btn btn-primary" onClick={()=>setIndex(i=>Math.min(questions.length-1,i+1))}>{t.next}</button></div>
    </div>
    <button className="btn btn-primary submit-test" disabled={submitting} onClick={()=>{if(window.confirm(t.confirm)) submit(false);}}>{submitting ? "Submitting..." : t.submit}</button>{message && <div className="inline-message">{message}</div>}
  </div><aside className="palette-card"><h3>{t.palette}</h3><div className="palette-legend"><span><i className="legend-dot answered"/> {t.answered}</span><span><i className="legend-dot review"/> {t.review}</span></div><div className="palette">{questions.map((q,i)=><button key={q.id} className={`${answers[q.id] ? "answered" : ""} ${marked[q.id] ? "review" : ""} ${index===i ? "current" : ""}`} onClick={()=>setIndex(i)}>{i+1}</button>)}</div><div className="palette-summary">{Object.values(answers).filter(Boolean).length} {t.answered} · {questions.length-Object.values(answers).filter(Boolean).length} {t.unanswered}</div></aside></div>;
}

export function Results() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(() => { let alive=true; async function load() { if (!supabase || !user) { setLoading(false); return; } const { data,error } = await supabase.from("results").select("*, tests(title, category)").eq("student_id", user.id).order("created_at",{ascending:false}); if(!alive)return; setRows(data||[]);setError(error?.message||"");setLoading(false); } load();return()=>{alive=false;}; }, [user]);
  return <><PageHeader title="Your results" description="Review your test attempts and monitor your progress."/><div className="stats-grid"><Stat icon={ClipboardList} label="Total attempts" value={rows.length}/><Stat icon={CheckCircle2} label="Questions correct" value={rows.reduce((a,r)=>a+Number(r.correct_count||0),0)}/><Stat icon={Target} label="Average score" value={rows.length ? `${Math.round(rows.reduce((a,r)=>a+Number(r.percentage||0),0)/rows.length)}%` : "—"}/></div>{error&&<div className="inline-message">{error}</div>}{loading ? <div className="loading-line">Loading results...</div> : rows.length ? <div className="data-card-list">{rows.map(r=><div className="data-row" key={r.id}><div className="row-icon"><Trophy/></div><div className="row-main"><b>{r.tests?.title || "Test attempt"}</b><small>{new Date(r.created_at).toLocaleString()} · {r.correct_count} correct · {r.wrong_count} wrong · {r.unattempted_count} unattempted</small></div><div className="result-score"><b>{r.score}</b><small>{r.percentage}%</small></div><Link className="btn btn-outline btn-small" to={`/app/result/${r.id}`}>View solutions</Link></div>)}</div> : <EmptyState title="No results yet" text="Complete your first mock test to see your score and analysis here."/>}</>;
}

export function ResultDetail() {
  const { id } = useParams(); const { user } = useAuth();
  const [result,setResult]=useState(null); const [test,setTest]=useState(null); const [questions,setQuestions]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [language,setLanguage]=useState("en");
  useEffect(()=>{let alive=true;async function load(){if(!supabase||!user){setLoading(false);return;}const {data:r,error:re}=await supabase.from("results").select("*").eq("id",id).eq("student_id",user.id).single();if(re){if(alive){setError(re.message);setLoading(false);}return;}const [tr,qr]=await Promise.all([supabase.from("tests").select("*").eq("id",r.test_id).single(),supabase.from("questions").select("*").eq("test_id",r.test_id).order("position")]);if(alive){setResult(r);setTest(tr.data);setQuestions(qr.data||[]);setError(tr.error?.message||qr.error?.message||"");setLoading(false);}}load();return()=>{alive=false;};},[id,user]);
  if(loading)return <div className="loading-line">Loading solutions...</div>;if(!result)return <><PageHeader title="Result unavailable"/><EmptyState title="Result could not be loaded" text={error||"This result may not belong to your account."}/></>;
  const answers=result.answers||{};const accuracy=result.attempted_count?Math.round(result.correct_count/result.attempted_count*100):0;
  return <><PageHeader title={test?.title||"Test review"} description="Your score, answer status and explanations."/><div className="stats-grid"><Stat icon={Trophy} label="Score" value={`${result.score} / ${result.total_marks}`}/><Stat icon={CheckCircle2} label="Correct" value={result.correct_count}/><Stat icon={Target} label="Wrong" value={result.wrong_count}/><Stat icon={ClipboardList} label="Accuracy" value={`${accuracy}%`}/></div><div className="review-toolbar"><label>Review language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bi">Bilingual</option></select></label><span>{result.unattempted_count} unanswered</span></div>
  <div className="review-question-list">{questions.map((q,i)=>{const picked=answers[q.id]||null;const isCorrect=picked===q.correct_option;const qText=language==="hi"?(q.question_text_hi||q.question_text):q.question_text;return <article className="panel review-question" key={q.id}><div className="review-q-head"><b>Question {i+1}</b><span className={`pill ${!picked?"pill-gray":isCorrect?"pill-green":"pill-red"}`}>{!picked?"Not attempted":isCorrect?"Correct":"Wrong"}</span></div><h3>{qText}</h3>{language==="bi"&&q.question_text_hi&&<p className="hindi-secondary">{q.question_text_hi}</p>}<div className="review-options">{["A","B","C","D"].map(opt=>{const label=language==="hi"?(q[`option_${opt.toLowerCase()}_hi`]||q[`option_${opt.toLowerCase()}`]):q[`option_${opt.toLowerCase()}`];return <div key={opt} className={`review-option ${opt===q.correct_option?"right-answer":""} ${opt===picked&&opt!==q.correct_option?"wrong-answer":""}`}><b>{opt}</b><span>{label}{language==="bi"&&q[`option_${opt.toLowerCase()}_hi`]&&<small className="hindi-option">{q[`option_${opt.toLowerCase()}_hi`]}</small>}</span>{opt===q.correct_option&&<small>Correct answer</small>}{opt===picked&&<small>Your answer</small>}</div>;})}</div><div className="solution-box"><b>Explanation</b><p>{q.explanation||"No explanation has been added for this question."}</p></div></article>;})}</div></>;
}

export function Performance() {
  const { user } = useAuth(); const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let alive=true;async function load(){if(!supabase||!user){setLoading(false);return;}const {data,error}=await supabase.from("results").select("*, tests(title,category)").eq("student_id",user.id).order("created_at",{ascending:true});if(alive){setRows(data||[]);setError(error?.message||"");setLoading(false);}}load();return()=>{alive=false;};},[user]);
  const attempts=rows.length;const avg=attempts?Math.round(rows.reduce((a,r)=>a+Number(r.percentage||0),0)/attempts):0;const best=attempts?Math.max(...rows.map(r=>Number(r.percentage||0))):0;const totalCorrect=rows.reduce((a,r)=>a+Number(r.correct_count||0),0);const totalWrong=rows.reduce((a,r)=>a+Number(r.wrong_count||0),0);const totalAttempted=rows.reduce((a,r)=>a+Number(r.attempted_count||0),0);const accuracy=totalAttempted?Math.round(totalCorrect/totalAttempted*100):0;
  return <><PageHeader title="Performance" description="Understand your progress across test attempts."/>{error&&<div className="inline-message">{error}</div>}<div className="stats-grid"><Stat icon={Trophy} label="Tests completed" value={attempts}/><Stat icon={Target} label="Average score" value={attempts?`${avg}%`:"—"}/><Stat icon={CheckCircle2} label="Best score" value={attempts?`${best}%`:"—"}/><Stat icon={ClipboardList} label="Accuracy" value={totalAttempted?`${accuracy}%`:"—"}/></div><div className="panel"><h3>Overall answer analysis</h3><div className="performance-breakdown"><div><b>{totalCorrect}</b><span>Correct answers</span></div><div><b>{totalWrong}</b><span>Wrong answers</span></div><div><b>{rows.reduce((a,r)=>a+Number(r.unattempted_count||0),0)}</b><span>Unanswered</span></div></div></div><div className="panel"><h3>Attempt history</h3>{loading?<div className="loading-line">Loading performance...</div>:rows.length?<div className="data-card-list">{[...rows].reverse().map(r=><div className="data-row" key={r.id}><div className="row-main"><b>{r.tests?.title||"Mock test"}</b><small>{new Date(r.created_at).toLocaleDateString()} · {r.correct_count} correct / {r.wrong_count} wrong / {r.unattempted_count} unanswered</small></div><b>{r.score} marks · {r.percentage}%</b><Link className="btn btn-outline btn-small" to={`/app/result/${r.id}`}>Review</Link></div>)}</div>:<EmptyState title="Your progress will appear here" text="Complete a mock test to see your score and performance analysis."/>}</div></>;
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
      ) : rows.length ? (
        <div className="data-card-list">
          {rows.map((n) => (
            <article className="announcement-card" key={n.id}>
              <div className="notice-dot" />
              <div>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <small>{new Date(n.created_at).toLocaleDateString()}</small>
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
  const { rows: examCategories, loading: categoriesLoading, error: categoriesError } = useStudentCategories();
  useEffect(()=>{setName(profile?.full_name||"");setPhone(profile?.phone||"");setPreference(profile?.exam_preference||"RRB NTPC");},[profile]);
  async function save(e){e.preventDefault();const {error}=await supabase.from("profiles").update({full_name:name,phone,exam_preference:preference}).eq("id",user.id);setMessage(error?.message||"Profile updated successfully.");if(!error)refreshProfile();}
  return <><PageHeader title="Profile" description="Manage your personal details and exam preference."/><form className="panel profile-form" onSubmit={save}><label>Full name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Email address<input value={user?.email||""} disabled/></label><label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number"/></label><label>Exam preference<select value={preference} onChange={e=>setPreference(e.target.value)}>{preference && !examCategories.some(c=>c.name===preference) && <option value={preference}>{preference}</option>}{examCategories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></label>{categoriesError&&<div className="inline-message">Could not load exam categories: {categoriesError}</div>}{categoriesLoading&&<small className="muted">Loading exam categories...</small>}{message&&<div className="inline-message">{message}</div>}<button className="btn btn-primary">Save changes</button></form></>;
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


export function AdminCategories() {
  const { rows, loading, error, reload } = useRows("categories");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() { setName(""); setDescription(""); setEditingId(null); setMessage(""); }

  async function saveCategory(e) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true); setMessage("");
    const wasEditing = Boolean(editingId);
    const payload = { name: name.trim(), description: description.trim() || null };
    const result = editingId
      ? await supabase.from("categories").update(payload).eq("id", editingId)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (result.error) { setMessage(result.error.message); return; }
    resetForm();
    setMessage(wasEditing ? "Category updated successfully." : "Category added successfully.");
    await reload();
  }

  function startEdit(category) {
    setEditingId(category.id); setName(category.name || "");
    setDescription(category.description || ""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActive(category) {
    const { error } = await supabase.from("categories").update({ is_active: !category.is_active }).eq("id", category.id);
    if (error) setMessage(error.message); else { setMessage(`Category ${category.is_active ? "hidden" : "published"} successfully.`); await reload(); }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete ${category.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) setMessage(error.message); else { setMessage("Category deleted successfully."); await reload(); }
  }

  return <>
    <PageHeader eyebrow="ADMIN WORKSPACE" title="Category management" description="Add and manage railway examination categories."/>
    <form className="panel profile-form" onSubmit={saveCategory} style={{maxWidth:"none", marginBottom:18}}>
      <h3 style={{margin:0}}>{editingId ? "Edit category" : "Add new category"}</h3>
      <label>Category name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. RRB NTPC" required maxLength={80}/></label>
      <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description of this examination" rows={3}/></label>
      {message && <div className="inline-message">{message}</div>}
      {error && <div className="inline-message">{error}</div>}
      <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : <><Save size={15}/> {editingId ? "Update category" : "Add category"}</>}</button>
        {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}><X size={15}/> Cancel edit</button>}
      </div>
    </form>
    <div className="toolbar"><div className="muted">{rows.length} categories</div><button className="btn btn-outline" onClick={reload}><RefreshCw size={15}/> Refresh</button></div>
    {loading ? <div className="loading-line">Loading categories...</div> : rows.length ? <div className="data-card-list">
      {rows.map(category => <div className="data-row" key={category.id}>
        <div className="row-icon"><BookOpen/></div>
        <div className="row-main"><b>{category.name}</b><small>{category.description || "No description added"}</small></div>
        <span className={`pill ${category.is_active ? "pill-green" : "pill-gray"}`}>{category.is_active ? "Active" : "Hidden"}</span>
        <button className="btn btn-outline btn-small" onClick={()=>startEdit(category)} title="Edit category"><Pencil size={14}/> Edit</button>
        <button className="btn btn-outline btn-small" onClick={()=>toggleActive(category)}>{category.is_active ? "Hide" : "Publish"}</button>
        <button className="btn btn-outline btn-small danger-outline" onClick={()=>deleteCategory(category)} title="Delete category"><Trash2 size={14}/></button>
      </div>)}
    </div> : <EmptyState title="No categories found" text="Add your first railway exam category using the form above."/>}
  </>;
}

export function AdminDashboard() {
  const { rows: students }=useRows("profiles");
  const { rows: tests }=useRows("tests");
  const { rows: results }=useRows("results");
  const { rows: examCategories }=useRows("categories");
  return <><PageHeader eyebrow="ADMIN WORKSPACE" title="Admin dashboard" description="Monitor your platform and manage exam preparation content."/><div className="stats-grid"><Stat icon={Users} label="Registered profiles" value={students.length}/><Stat icon={ClipboardList} label="Total tests" value={tests.length}/><Stat icon={Trophy} label="Test attempts" value={results.length}/><Stat icon={BookOpen} label="Exam categories" value={examCategories.length}/></div><div className="content-grid"><div className="panel"><h3>Content management</h3><p className="muted">Manage the resources available to students.</p><div className="admin-shortcuts"><Link to="/admin/tests"><ClipboardList/> Manage tests <ArrowUpRight/></Link><Link to="/admin/questions"><FileText/> Manage questions <ArrowUpRight/></Link><Link to="/admin/pyq"><BookOpen/> Manage PYQs <ArrowUpRight/></Link><Link to="/admin/announcements"><Bell/> Publish announcements <ArrowUpRight/></Link></div></div><div className="panel"><h3>Important setup note</h3><p className="muted">Admin access is granted only through a trusted database-side role change. Never allow public signup to assign the admin role.</p><div className="security-note"> <CheckCircle2/> Role-based access is enforced by database policies in the supplied SQL setup.</div></div></div></>;
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
