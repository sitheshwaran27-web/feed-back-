import { Toaster } from "@/components/ui/toaster";
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
import { MadeWithDyad } from "./components/made-with-dyad";
import { ThemeProvider } from "./components/ThemeProvider"; // Import ThemeProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme"> {/* Wrap with ThemeProvider */}
      <TooltipProvider>
        <Toaster /> {/* This is shadcn/ui's Toaster */}
        <BrowserRouter>
          <SessionContextProvider>
            <div>
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
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider> {/* Close ThemeProvider */}
  </QueryClientProvider>
);

export default App;