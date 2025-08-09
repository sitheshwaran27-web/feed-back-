import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import StudentTimetable from "./pages/StudentTimetable";
import Layout from "./components/Layout";
import { MadeWithDyad } from "./components/made-with-dyad";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <div className="flex flex-col min-h-screen">
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Index /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/not-found" element={<Layout><NotFound /></Layout>} />

      {/* Authenticated Routes */}
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute>
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/timetable"
        element={
          <ProtectedRoute>
            <Layout><StudentTimetable /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        } 
      />

      {/* Catch-all for any other undefined routes */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
    <MadeWithDyad />
  </div>
);

export default App;