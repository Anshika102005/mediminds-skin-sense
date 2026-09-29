import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Activity,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  FileDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/lib/languageContext";
import { useAuth } from "@/lib/authContext";
import { API_BASE } from "@/lib/api";

export const PatientDashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [screenings, setScreenings] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedScreening, setSelectedScreening] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const patientId = user?.patient_id || (user?.role === "patient" ? user.id : "");
        if (patientId) {
          const res = await fetch(`${API_BASE}/api/patients/${patientId}/screenings`);
          if (res.ok) {
            const data = await res.json();
            setScreenings(data.screenings || []);
            setAppointments(data.appointments || []);
          }
        }
      } catch {
        // Continue with empty or cached list
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [user]);

  const latestScreening = screenings[0] || null;
  const nextAppointment = appointments.find((a) => a.status === "Scheduled") || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="flex-1 med-container py-10 max-w-6xl">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#DCE7E5] gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF7F5] text-[#17324D] border border-[#DCE7E5] mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{language === "hi" ? "व्यक्तिगत रोगी पोर्टल" : "Patient Health Portal"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] tracking-tight">
              {language === "hi"
                ? `नमस्ते, ${user?.full_name || "रोगी"}`
                : `Welcome, ${user?.full_name || "Patient"}`}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8B98] mt-1">
              {language === "hi"
                ? "अपनी पिछली त्वचा स्क्रीनिंग, Grad-CAM हीटमैप और अपॉइंटमेंट्स की समीक्षा करें।"
                : "Manage your longitudinal skin screenings, explainability heatmaps, and clinic consultations."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/patient/skin-check")}
              className="bg-[#0F766E] hover:bg-[#0C655E] text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <span>{language === "hi" ? "नई स्क्रीनिंग शुरू करें" : "Start New Skin Screening"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* 4 KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
              Total Screenings
            </span>
            <div className="text-2xl font-extrabold text-[#17324D] mt-1">{screenings.length}</div>
            <p className="text-[11px] text-[#7B8B98] mt-1">Records in database</p>
          </Card>

          <Card className="p-5 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
              Latest Screening
            </span>
            <div className="text-sm font-bold text-[#17324D] mt-1 truncate">
              {latestScreening ? latestScreening.class_name : "No screenings yet"}
            </div>
            <p className="text-[11px] text-[#7B8B98] mt-1">
              {latestScreening?.created_at ? latestScreening.created_at.slice(0, 10) : "N/A"}
            </p>
          </Card>

          <Card className="p-5 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
              Follow-Up Status
            </span>
            <div className="text-sm font-bold mt-1">
              {latestScreening?.malignant_referral ? (
                <span className="text-[#B84A5A]">{language === "hi" ? "समीक्षा अनुशंसित" : "Review Recommended"}</span>
              ) : (
                <span className="text-[#2E8B72]">{language === "hi" ? "नियमित निगरानी" : "Routine Monitoring"}</span>
              )}
            </div>
            <p className="text-[11px] text-[#7B8B98] mt-1">Validated 0.35 threshold</p>
          </Card>

          <Card className="p-5 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
              Next Consultation
            </span>
            <div className="text-sm font-bold text-[#17324D] mt-1 truncate">
              {nextAppointment ? `${nextAppointment.appointment_date}` : "None scheduled"}
            </div>
            <p className="text-[11px] text-[#7B8B98] mt-1">
              {nextAppointment ? nextAppointment.purpose : "Routine awareness"}
            </p>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="screenings" className="w-full">
          <TabsList className="mb-6 bg-[#EEF7F5] p-1 border border-[#DCE7E5] rounded-xl">
            <TabsTrigger value="screenings" className="text-xs font-semibold rounded-lg">
              {t("dashScreeningHistory")}
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs font-semibold rounded-lg">
              {t("dashAppointments")}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs font-semibold rounded-lg">
              Care & Review Protocol
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs font-semibold rounded-lg">
              {t("dashProfile")}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SCREENING HISTORY */}
          <TabsContent value="screenings" className="mt-0">
            {screenings.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-[#DCE7E5] rounded-2xl">
                <Activity className="w-12 h-12 text-[#DCE7E5] mx-auto mb-3" />
                <h3 className="font-bold text-base text-[#17324D]">No screenings recorded yet</h3>
                <p className="text-xs text-[#7B8B98] max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                  Run your first AI-assisted screening to track skin lesion patterns and inspect explainability heatmaps.
                </p>
                <Button
                  onClick={() => navigate("/patient/skin-check")}
                  className="bg-[#0F766E] text-white text-xs font-semibold px-6 py-2.5 rounded-xl"
                >
                  Start First Skin Screening
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {screenings.map((s) => (
                  <Card
                    key={s.id}
                    className="p-5 bg-white border border-[#DCE7E5] rounded-2xl hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[11px] text-[#7B8B98] block">
                            {s.created_at ? s.created_at.slice(0, 10) : "Screening"}
                          </span>
                          <h4 className="font-bold text-base text-[#17324D] mt-0.5">
                            {s.class_name} ({s.prediction?.toUpperCase()})
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            s.malignant_referral
                              ? "bg-[#F9ECEE] text-[#7A2E3A] border border-[#E8BCC3]"
                              : "bg-[#EEF7F5] text-[#1F6B58] border border-[#DCE7E5]"
                          }`}
                        >
                          {s.malignant_referral ? "Requires Review" : "Lower Concern"}
                        </span>
                      </div>

                      {s.image_b64 && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#EEF7F5] mb-3 border border-[#DCE7E5]">
                          <img
                            src={s.image_b64.startsWith("data:") ? s.image_b64 : `data:image/png;base64,${s.image_b64}`}
                            alt="Skin screening"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="text-xs text-[#5F7182] space-y-1.5 mb-4 p-3 bg-[#F7FAF9] rounded-xl border border-[#DCE7E5]">
                        <div className="flex justify-between">
                          <span className="text-[#7B8B98]">Similarity Confidence:</span>
                          <span className="font-semibold text-[#17324D]">
                            {(s.confidence <= 1.0 ? s.confidence * 100 : s.confidence).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8B98]">Malignant Risk Score:</span>
                          <span className="font-semibold text-[#17324D]">
                            {(s.malignant_prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8B98]">Clinical Review:</span>
                          <span className="font-semibold text-[#5F7182]">
                            {s.review_status || "Pending Assignment"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setSelectedScreening(s)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-[#7B8B98]" />
                        View Full Report
                      </Button>
                      <Button
                        onClick={() => navigate(`/screening/gradcam?id=${s.id}`)}
                        size="sm"
                        className="bg-[#0F766E] text-white text-xs rounded-xl px-3"
                        title="Grad-CAM"
                      >
                        Grad-CAM
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: APPOINTMENTS */}
          <TabsContent value="appointments" className="mt-0">
            <Card className="p-6 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
              <h3 className="font-bold text-base text-[#17324D] mb-4">
                Scheduled Clinician Consultations
              </h3>
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7B8B98] bg-[#F7FAF9] rounded-xl border border-[#DCE7E5]">
                  <Calendar className="w-8 h-8 text-[#DCE7E5] mx-auto mb-2" />
                  <p>No appointments currently scheduled.</p>
                  <p className="mt-1">
                    When an authorized clinician reviews your screening, follow-up consultations will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl border border-[#DCE7E5] bg-[#F7FAF9]/70 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-[#17324D]">{a.purpose}</div>
                        <div className="text-[#7B8B98] flex items-center space-x-3">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-[#7B8B98]" />
                            {a.appointment_date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-[#7B8B98]" />
                            {a.appointment_time}
                          </span>
                        </div>
                        {a.doctor_name && (
                          <div className="text-[#5F7182] font-medium">
                            Clinician: {a.doctor_name} ({a.org_name || "Healthcare Center"})
                          </div>
                        )}
                        {a.notes && (
                          <p className="text-[11px] text-[#7B8B98] italic mt-1">{a.notes}</p>
                        )}
                      </div>

                      <span className="px-3 py-1 bg-[#EEF7F5] text-[#0F766E] border border-[#DCE7E5] font-semibold rounded-full self-start sm:self-auto">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: CARE TIMELINE */}
          <TabsContent value="timeline" className="mt-0">
            <Card className="p-6 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
              <h3 className="font-bold text-base text-[#17324D] mb-4">
                Care & Review Protocol Timeline
              </h3>
              <div className="space-y-6 border-l-2 border-[#DCE7E5] pl-5 ml-2">
                <div>
                  <h4 className="font-bold text-xs text-[#17324D]">1. Image Capture & Screening</h4>
                  <p className="text-xs text-[#7B8B98] mt-0.5">
                    Clear lesion image evaluated against EfficientNetB0 neural model with test-time augmentation.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#17324D]">2. Sensitivity Referral Evaluation</h4>
                  <p className="text-xs text-[#7B8B98] mt-0.5">
                    Checked against frozen 0.35 threshold on grouped malignant classes (mel, bcc, akiec).
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#17324D]">3. Clinician Triage & Review</h4>
                  <p className="text-xs text-[#7B8B98] mt-0.5">
                    Screenings requiring review are accessible to authorized hospital clinicians for clinical notes.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#17324D]">4. Clinician Care Plan & Follow-up</h4>
                  <p className="text-xs text-[#7B8B98] mt-0.5">
                    Clinicians manually enter care instructions, medications, and schedule in-person evaluations.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: PROFILE */}
          <TabsContent value="profile" className="mt-0">
            <Card className="p-6 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm max-w-xl">
              <div className="flex items-center space-x-3 border-b border-[#DCE7E5] pb-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-base">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#17324D]">{user?.full_name || "Patient Profile"}</h3>
                  <span className="text-xs text-[#7B8B98]">Patient Account</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#DCE7E5]">
                  <span className="text-[#7B8B98]">Email Address:</span>
                  <span className="font-semibold text-[#17324D]">{user?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DCE7E5]">
                  <span className="text-[#7B8B98]">Phone Number:</span>
                  <span className="font-semibold text-[#17324D]">{user?.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DCE7E5]">
                  <span className="text-[#7B8B98]">Patient ID:</span>
                  <span className="font-mono text-[#5F7182]">{user?.patient_id || user?.id || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DCE7E5]">
                  <span className="text-[#7B8B98]">Access Role:</span>
                  <span className="font-semibold text-[#17324D] uppercase">Patient</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL: VIEW FULL REPORT */}
        {selectedScreening && (
          <div className="fixed inset-0 bg-[#0F766E]/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-[#DCE7E5] pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
                    Screening Report
                  </span>
                  <h3 className="font-bold text-xl text-[#17324D] mt-0.5">
                    {selectedScreening.class_name} ({selectedScreening.prediction?.toUpperCase()})
                  </h3>
                  <span className="text-xs text-[#7B8B98]">
                    Recorded on {selectedScreening.created_at?.slice(0, 10)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedScreening(null)}
                  className="text-[#7B8B98] hover:text-[#5F7182]"
                >
                  ✕
                </Button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed border ${
                  selectedScreening.malignant_referral
                    ? "bg-[#F9ECEE] border-[#E8BCC3] text-[#7A2E3A]"
                    : "bg-[#EEF7F5] border-[#DCE7E5] text-emerald-950"
                }`}
              >
                <div className="font-bold mb-1">
                  {selectedScreening.malignant_referral
                    ? "Requires Professional Review"
                    : "Lower Concern — Routine Follow-up"}
                </div>
                <p>{selectedScreening.status_message}</p>
              </div>

              {/* Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedScreening.image_b64 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#5F7182] mb-1.5">Original Lesion Image</h4>
                    <img
                      src={
                        selectedScreening.image_b64.startsWith("data:")
                          ? selectedScreening.image_b64
                          : `data:image/png;base64,${selectedScreening.image_b64}`
                      }
                      alt="Skin Lesion"
                      className="w-full aspect-square object-cover rounded-xl border border-[#DCE7E5]"
                    />
                  </div>
                )}

                {selectedScreening.gradcam_overlay_b64 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#5F7182] mb-1.5">Grad-CAM Overlay</h4>
                    <img
                      src={`data:image/png;base64,${selectedScreening.gradcam_overlay_b64}`}
                      alt="Grad-CAM Overlay"
                      className="w-full aspect-square object-cover rounded-xl border border-[#DCE7E5]"
                    />
                  </div>
                )}
              </div>

              {/* Clinical Review Status */}
              <div className="p-4 bg-[#F7FAF9] rounded-xl border border-[#DCE7E5] text-xs space-y-1.5">
                <div className="font-bold text-[#17324D]">Clinician Review:</div>
                <div className="text-[#5F7182]">
                  Status: <strong>{selectedScreening.review_status || "Awaiting Review"}</strong>
                </div>
                {selectedScreening.clinical_notes && (
                  <div className="text-[#5F7182] mt-1 italic">
                    Notes: "{selectedScreening.clinical_notes}"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl"
                >
                  <FileDown className="w-3.5 h-3.5 mr-1.5" />
                  Print / Save Summary
                </Button>
                <Button
                  onClick={() => setSelectedScreening(null)}
                  className="bg-[#0F766E] text-white text-xs font-semibold px-6 py-2.5 rounded-xl"
                >
                  Close Record
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PatientDashboardPage;
