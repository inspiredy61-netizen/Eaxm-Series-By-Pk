import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ConfigNotice from "./components/ConfigNotice";
import Auth from "./pages/Auth";
import { StudentDashboard, Categories, TestList, TakeTest, Results, Performance, Announcements, Profile, Support, Account, AdminDashboard, AdminGeneric, ForgotPassword } from "./pages/Pages";

function StudentLayout(){return <Layout/>}
function AdminLayout(){return <Layout admin/>}

export default function App() {
  return <>
    <ConfigNotice/>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace/>}/>
      <Route path="/login" element={<Auth/>}/>
      <Route path="/admin-login" element={<Auth adminLogin/>}/>
      <Route path="/signup" element={<Auth signup/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>
      <Route element={<ProtectedRoute/>}>
        <Route path="/app" element={<StudentLayout/>}>
          <Route index element={<StudentDashboard/>}/>
          <Route path="categories" element={<Categories/>}/>
          <Route path="tests" element={<TestList/>}/>
          <Route path="test/:id" element={<TakeTest/>}/>
          <Route path="pyq" element={<TestList pyq/>}/>
          <Route path="results" element={<Results/>}/>
          <Route path="performance" element={<Performance/>}/>
          <Route path="announcements" element={<Announcements/>}/>
          <Route path="profile" element={<Profile/>}/>
          <Route path="support" element={<Support/>}/>
          <Route path="account" element={<Account/>}/>
        </Route>
      </Route>
      <Route element={<ProtectedRoute admin/>}>
        <Route path="/admin" element={<AdminLayout/>}>
          <Route index element={<AdminDashboard/>}/>
          <Route path="students" element={<AdminGeneric title="Student management" table="profiles" columns={["email","role","created_at"]}/>}/>
          <Route path="categories" element={<AdminGeneric title="Category management" table="categories"/>}/>
          <Route path="tests" element={<TestList admin/>}/>
          <Route path="questions" element={<AdminGeneric title="Question management" table="questions" columns={["test_id","position","question_text"]}/>}/>
          <Route path="pyq" element={<TestList pyq admin/>}/>
          <Route path="results" element={<AdminGeneric title="Student results" table="results" columns={["student_id","test_id","score","percentage","created_at"]}/>}/>
          <Route path="announcements" element={<AdminGeneric title="Announcements" table="announcements" columns={["title","is_published","created_at"]}/>}/>
          <Route path="profile" element={<AdminGeneric title="Admin profile" table="profiles" columns={["email","role"]}/>}/>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace/>}/>
    </Routes>
  </>;
}
