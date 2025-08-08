import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SessionContextProvider } from "./components/SessionContextProvider";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";
import { MadeWithDyad } from "./components/made-with-dyad"; // Import MadeWithDyad

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <div className="min-h-screen flex flex-col"> {/* Flex column for content + footer */}
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
            <MadeWithDyad /> {/* Global footer */}
          </div>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;