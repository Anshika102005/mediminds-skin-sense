import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./lib/languageContext";
import { AuthProvider } from "./lib/authContext";

import HomePage from "./pages/HomePage";
import DiagnosisPage from "./pages/DiagnosisPage";
import ResultsPage from "./pages/ResultsPage";
import GradCamPage from "./pages/GradCamPage";
import AwarenessPage from "./pages/AwarenessPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import ProfessionalsPage from "./pages/ProfessionalsPage";
import AuthPage from "./pages/AuthPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import ProfessionalDashboardPage from "./pages/ProfessionalDashboardPage";
import ContactPage from "./pages/ContactPage";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<HomePage />} />
              <Route path="/awareness" element={<AwarenessPage />} />
              <Route path="/abcde" element={<AwarenessPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/professionals" element={<ProfessionalsPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<LegalPage kind="privacy" />} />
              <Route path="/terms" element={<LegalPage kind="terms" />} />

              {/* Patient Routes */}
              <Route path="/patient/skin-check" element={<DiagnosisPage />} />
              <Route path="/diagnosis" element={<DiagnosisPage />} />
              <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
              <Route path="/patient/screenings" element={<PatientDashboardPage />} />
              <Route path="/patient/screenings/:id" element={<ResultsPage />} />
              <Route path="/patient/profile" element={<PatientDashboardPage />} />
              <Route path="/patient/appointments" element={<PatientDashboardPage />} />
              <Route path="/patient-dashboard" element={<Navigate to="/patient/dashboard" replace />} />

              {/* Screening Result & Explainability */}
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/screening/gradcam" element={<GradCamPage />} />
              <Route path="/screening/explain" element={<GradCamPage />} />
              <Route path="/patient/screenings/:id/gradcam" element={<GradCamPage />} />

              {/* Healthcare Professional Routes */}
              <Route path="/professional/dashboard" element={<ProfessionalDashboardPage />} />
              <Route path="/professional/patients" element={<ProfessionalDashboardPage />} />
              <Route path="/professional/patients/:id" element={<ProfessionalDashboardPage />} />
              <Route path="/professional/screenings/:id" element={<ProfessionalDashboardPage />} />
              <Route path="/professional/appointments" element={<ProfessionalDashboardPage />} />
              <Route path="/professional/profile" element={<ProfessionalDashboardPage />} />
              <Route path="/professional-dashboard" element={<Navigate to="/professional/dashboard" replace />} />
              <Route path="/professional-portal" element={<ProfessionalsPage />} />
              <Route path="/for-professionals" element={<ProfessionalsPage />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
