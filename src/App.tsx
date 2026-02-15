import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import ComplaintsList from "./pages/ComplaintsList";
import Events from "./pages/Events";
import Directory from "./pages/Directory";
import Notifications from "./pages/Notifications";
import Announcements from "./pages/Announcements";
import Analytics from "./pages/Analytics";
import ManageStaff from "./pages/ManageStaff";
import Payments from "./pages/Payments";
import Funds from "./pages/Funds";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="complaints/new" element={<NewComplaint />} />
              <Route path="complaints" element={<ComplaintsList />} />
              <Route path="events" element={<Events />} />
              <Route path="directory" element={<Directory />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="staff" element={<ManageStaff />} />
              <Route path="payments" element={<Payments />} />
              <Route path="funds" element={<Funds />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
