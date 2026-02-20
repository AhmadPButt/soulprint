import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Questionnaire from "./pages/Questionnaire";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import GeographicIntake from "./pages/GeographicIntake";
import DestinationDetail from "./pages/DestinationDetail";
import MyTrips from "./pages/MyTrips";
import TripDetail from "./pages/TripDetail";
import JoinTrip from "./pages/JoinTrip";
import CompareDestinations from "./pages/CompareDestinations";
import ResetPassword from "./pages/ResetPassword";
import AdminTravelerDetail from "./pages/AdminTravelerDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/intake" element={<GeographicIntake />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/destination/:destinationId" element={<DestinationDetail />} />
            <Route path="/trips" element={<MyTrips />} />
            <Route path="/trips/:tripId" element={<TripDetail />} />
            <Route path="/join-trip/:invitationToken" element={<JoinTrip />} />
            <Route path="/compare" element={<CompareDestinations />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/traveler/:respondentId" element={<AdminTravelerDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
