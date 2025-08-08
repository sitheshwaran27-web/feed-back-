import { Routes, Route } from "react-router-dom"; // Remove BrowserRouter import
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";
import { MadeWithDyad } from "./components/made-with-dyad";

const App = () => (
  <div>
    {/* BrowserRouter is now in main.tsx */}
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/not-found" element={<NotFound />} />

      {/* Authenticated Routes - wrapped with Layout */}
      <Route path="/student/dashboard" element={<Layout><StudentDashboard /></Layout>} />
      <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />

      {/* Catch-all for any other undefined routes, redirect to NotFound */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <MadeWithDyad />
  </div>
);

export default App;