import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";
import { MadeWithDyad } from "./components/made-with-dyad";

const App = () => (
  <div className="flex flex-col min-h-screen">
    <Routes>
      {/* Public Routes - now wrapped with Layout */}
      <Route path="/" element={<Layout><Index /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/not-found" element={<Layout><NotFound /></Layout>} />

      {/* Authenticated Routes - wrapped with Layout */}
      <Route path="/student/dashboard" element={<Layout><StudentDashboard /></Layout>} />
      <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />

      {/* Catch-all for any other undefined routes, redirect to NotFound */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
    <MadeWithDyad />
  </div>
);

export default App;