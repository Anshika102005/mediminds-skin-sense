import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  CheckCircle2,
  ShieldAlert,
  Search,
  User,
  Calendar,
  Clock,
  Eye,
  FileText,
  Stethoscope,
  Pill,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

export const ProfessionalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [stats, setStats] = useState<any>({
    total_patients: 0,
    total_screenings: 0,
    flagged_for_review: 0,
    follow_ups_pending: 0,
    completed_followups: 0,
  });

  const [flaggedList, setFlaggedList] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<any | null>(null);

  // Clinical Review Form
  const [reviewNote, setReviewNote] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Follow-up Required");
  const [selectedScreeningId, setSelectedScreeningId] = useState<string | null>(null);

  // Appointment Form
  const [aptDate, setAptDate] = useState("");
  const [aptTime, setAptTime] = useState("");
  const [aptPurpose, setAptPurpose] = useState("Dermatology In-Person Evaluation");

  // Treatment / Care Plan Form (Clinician-Entered only, AI NEVER prescribes)
  const [medicationNotes, setMedicationNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [treatmentFollowUpDate, setTreatmentFollowUpDate] = useState("");

  useEffect(() => {
    fetchOverview();
    fetchFlagged();
    fetchPatients();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/professionals/dashboard/overview`);
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchFlagged = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/professionals/screenings/flagged`);
      if (res.ok) setFlaggedList(await res.json());
    } catch {}
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/professionals/patients`);
      if (res.ok) setPatients(await res.json());
    } catch {}
  };

  const openPatientRecord = async (patientId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/professionals/patients/${patientId}/full-record`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPatientRecord(data);
      } else {
        toast.error("Unable to load patient record.");
      }
    } catch {
      toast.error("Failed to connect to patient records.");
    }
  };

  const handleSaveReview = async (screeningId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/professionals/screenings/${screeningId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_status: reviewStatus,
          clinical_notes: reviewNote.trim() || "Reviewed by clinician.",
          professional_id: user?.professional_id || "clinician-001",
        }),
      });

      if (res.ok) {
        toast.success("Clinical review recorded successfully.");
        setReviewNote("");
        setSelectedScreeningId(null);
        fetchOverview();
        fetchFlagged();
        if (selectedPatientRecord) {
          openPatientRecord(selectedPatientRecord.patient.id);
        }
      } else {
        toast.error("Failed to record review.");
      }
    } catch {
      toast.error("Failed to save review.");
    }
  };

  const handleCreateAppointment = async (patientId: string) => {
    if (!aptDate || !aptTime) {
      toast.error("Please specify both date and time for the appointment.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/professionals/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          professional_id: user?.professional_id || "clinician-001",
          appointment_date: aptDate,
          appointment_time: aptTime,
          purpose: aptPurpose,
          status: "Scheduled",
          notes: "Scheduled via Healthcare Professional Portal",
        }),
      });

      if (res.ok) {
        toast.success("Consultation appointment scheduled.");
        setAptDate("");
        setAptTime("");
        openPatientRecord(patientId);
      } else {
        toast.error("Failed to schedule appointment.");
      }
    } catch {
      toast.error("Failed to schedule appointment.");
    }
  };

  const handleSaveCarePlan = async (patientId: string) => {
    if (!treatmentPlan && !medicationNotes) {
      toast.error("Please enter treatment plan or medication instructions.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/professionals/treatments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          professional_id: user?.professional_id || "clinician-001",
          medication_notes: medicationNotes.trim(),
          treatment_plan: treatmentPlan.trim(),
          start_date: new Date().toISOString().slice(0, 10),
          follow_up_date: treatmentFollowUpDate || undefined,
          treatment_status: "Under Treatment",
        }),
      });

      if (res.ok) {
        toast.success("Clinician care plan recorded.");
        setMedicationNotes("");
        setTreatmentPlan("");
        setTreatmentFollowUpDate("");
        openPatientRecord(patientId);
      } else {
        toast.error("Failed to record care plan.");
      }
    } catch {
      toast.error("Failed to record care plan.");
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="flex-1 med-container py-10 max-w-7xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#DCE7E5] gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#EEF7F5] border border-[#DCE7E5]/80 px-3 py-1 rounded-full text-xs font-semibold text-teal-900 mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{user?.org_name || "Healthcare Facility"} • Clinical Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] tracking-tight">
              MediMinds Skin Sense • Healthcare Professional Portal
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8B98] mt-1">
              Logged in as: <strong>{user?.full_name || "Clinician"}</strong> (
              {user?.role_title || "Doctor"}) • Department: {user?.department || "Dermatology"}
            </p>
          </div>
        </div>

        {/* 4 Dashboard Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
              Total Patients
            </span>
            <div className="text-2xl font-extrabold text-[#17324D] mt-1">{stats.total_patients}</div>
            <p className="text-[11px] text-[#7B8B98] mt-1">In patient directory</p>
          </Card>

          <Card className="p-5 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
              Total Screenings
            </span>
            <div className="text-2xl font-extrabold text-[#17324D] mt-1">{stats.total_screenings}</div>
            <p className="text-[11px] text-[#7B8B98] mt-1">Evaluated by AI model</p>
          </Card>

          <Card className="p-5 bg-white border border-[#E8BCC3] bg-[#F9ECEE]/30 rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#B84A5A] uppercase tracking-wider block">
              High Priority Referrals
            </span>
            <div className="text-2xl font-extrabold text-[#7A2E3A] mt-1">{stats.flagged_for_review}</div>
            <p className="text-[11px] text-[#8A4A56] mt-1">Met 0.35 sensitivity threshold</p>
          </Card>

          <Card className="p-5 bg-white border border-[#E4CDA3] bg-[#FBF4E6]/30 rounded-2xl shadow-sm">
            <span className="text-[11px] font-bold text-[#C98A2E] uppercase tracking-wider block">
              Pending Follow-Ups
            </span>
            <div className="text-2xl font-extrabold text-[#7A5A1E] mt-1">{stats.follow_ups_pending}</div>
            <p className="text-[11px] text-[#C98A2E] mt-1">Awaiting clinician contact</p>
          </Card>
        </div>

        {/* Tabs: Referrals Queue vs Searchable Directory */}
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-6 bg-[#EEF7F5] p-1 border border-[#DCE7E5] rounded-xl">
            <TabsTrigger value="queue" className="text-xs font-semibold rounded-lg flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#B84A5A]" />
              <span>High Priority / Requires Review ({flaggedList.length})</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="text-xs font-semibold rounded-lg flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#5F7182]" />
              <span>Searchable Patient Directory ({patients.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: HIGH PRIORITY REFERRALS */}
          <TabsContent value="queue" className="mt-0">
            {flaggedList.length === 0 ? (
              <Card className="p-12 text-center bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-[#2E8B72] mx-auto mb-3" />
                <h3 className="font-bold text-base text-[#17324D]">No Pending Referrals</h3>
                <p className="text-xs text-[#7B8B98] max-w-sm mx-auto mt-1">
                  All high-sensitivity screening referrals have been triaged or reviewed by clinical staff.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {flaggedList.map((item) => (
                  <Card key={item.id} className="p-5 bg-white border border-[#E8BCC3]/80 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      <div className="md:col-span-2">
                        {item.image_b64 ? (
                          <img
                            src={item.image_b64.startsWith("data:") ? item.image_b64 : `data:image/png;base64,${item.image_b64}`}
                            alt="Lesion"
                            className="w-full aspect-square rounded-xl object-cover border border-[#DCE7E5]"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-xl bg-[#EEF7F5] flex items-center justify-center text-xs text-[#7B8B98]">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-6 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-base text-[#17324D]">{item.patient_name}</span>
                          <span className="text-xs text-[#7B8B98]">
                            ({item.age}y, {item.gender})
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F9ECEE] text-[#7A2E3A] border border-[#E8BCC3]">
                            Requires Review
                          </span>
                        </div>

                        <div className="text-xs text-[#5F7182]">
                          <strong>AI Prediction:</strong> {item.class_name} ({item.prediction?.toUpperCase()}) •{" "}
                          {(item.confidence <= 1.0 ? item.confidence * 100 : item.confidence).toFixed(1)}% confidence
                        </div>

                        <div className="text-xs text-[#7A2E3A] font-semibold">
                          Malignant score p(mel+bcc+akiec): {(item.malignant_prob * 100).toFixed(1)}% (Threshold: 35.0%)
                        </div>

                        <div className="text-[11px] text-[#7B8B98]">
                          Screening Date: {item.created_at?.slice(0, 10)} • Status: {item.review_status || "New Screening"}
                        </div>
                      </div>

                      <div className="md:col-span-4 flex flex-col gap-2 justify-end">
                        <Button
                          onClick={() => setSelectedScreeningId(selectedScreeningId === item.id ? null : item.id)}
                          size="sm"
                          className="med-btn-primary text-xs font-semibold rounded-xl h-auto"
                        >
                          Record Clinical Review Notes
                        </Button>
                        <Button
                          onClick={() => openPatientRecord(item.patient_id)}
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl"
                        >
                          View Full Patient Record
                        </Button>
                      </div>
                    </div>

                    {/* Inline Clinical Review Editor */}
                    {selectedScreeningId === item.id && (
                      <div className="mt-5 pt-5 border-t border-[#DCE7E5] space-y-3 bg-[#F7FAF9]/60 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#17324D]">
                            Record Clinical Assessment (Dermatologist / Nurse)
                          </h4>
                          <span className="text-[10px] text-[#7B8B98]">
                            Entered as licensed healthcare professional note
                          </span>
                        </div>

                        <Textarea
                          placeholder="Document your clinical findings, dermoscopic evaluation, or recommendations for in-person biopsy..."
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          className="text-xs resize-none bg-white rounded-xl"
                          rows={3}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-[#5F7182]">Triage Status:</span>
                            <Select value={reviewStatus} onValueChange={setReviewStatus}>
                              <SelectTrigger className="text-xs w-48 rounded-xl bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                                <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                                <SelectItem value="Follow-up Completed">Follow-up Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedScreeningId(null)}
                              className="text-xs rounded-xl"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveReview(item.id)}
                              className="bg-[#0F766E] text-white text-xs rounded-xl px-4"
                            >
                              Save Clinical Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PATIENT DIRECTORY */}
          <TabsContent value="patients" className="mt-0">
            <Card className="p-6 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#DCE7E5] gap-3">
                <h3 className="font-bold text-base text-[#17324D]">
                  Searchable Patient Directory
                </h3>
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-[#7B8B98] absolute left-3 top-3" />
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <p className="text-xs text-[#7B8B98] py-6 text-center">No matching patient records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE7E5] text-[#7B8B98] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Patient ID</th>
                        <th className="py-2.5 px-3">Patient Name</th>
                        <th className="py-2.5 px-3">Age / Gender</th>
                        <th className="py-2.5 px-3">Screenings</th>
                        <th className="py-2.5 px-3">Risk Status</th>
                        <th className="py-2.5 px-3">Last Activity</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F7FAF9]/80 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-[#7B8B98]">
                            {p.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-3 font-bold text-[#17324D]">{p.full_name}</td>
                          <td className="py-3 px-3 text-[#5F7182]">
                            {p.age} yrs • {p.gender}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#17324D]">
                            {p.total_screenings || 0}
                          </td>
                          <td className="py-3 px-3">
                            {p.has_flagged_screening ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9ECEE] text-[#7A2E3A] border border-[#E8BCC3]">
                                Requires Review
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF7F5] text-[#2E8B72] border border-[#DCE7E5]">
                                Routine
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#7B8B98] text-[11px]">
                            {p.last_screening_date ? p.last_screening_date.slice(0, 10) : "N/A"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              onClick={() => openPatientRecord(p.id)}
                              variant="outline"
                              size="sm"
                              className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl"
                            >
                              View Patient
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL: FULL PATIENT RECORD FOR CLINICIANS */}
        {selectedPatientRecord && (
          <div className="fixed inset-0 bg-[#0F766E]/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-[#DCE7E5] pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#7B8B98] uppercase tracking-wider block">
                    Patient Medical File
                  </span>
                  <h3 className="font-bold text-xl text-[#17324D] mt-0.5">
                    {selectedPatientRecord.patient.full_name}
                  </h3>
                  <div className="text-xs text-[#7B8B98] mt-0.5">
                    Age {selectedPatientRecord.patient.age} • Gender: {selectedPatientRecord.patient.gender} • Phone:{" "}
                    {selectedPatientRecord.patient.phone || "Not provided"} • ID: {selectedPatientRecord.patient.id}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPatientRecord(null)}
                  className="text-[#7B8B98] hover:text-[#5F7182]"
                >
                  ✕
                </Button>
              </div>

              {/* SECTION: SCREENING HISTORY WITH GRAD-CAM */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#5F7182] flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1 text-[#0F766E]" />
                  Screening History & Explainability Maps ({selectedPatientRecord.screenings.length})
                </h4>

                {selectedPatientRecord.screenings.length === 0 ? (
                  <p className="text-xs text-[#7B8B98] italic">No screenings recorded for this patient.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedPatientRecord.screenings.map((sc: any) => (
                      <div
                        key={sc.id}
                        className="p-4 border border-[#DCE7E5] rounded-xl bg-[#F7FAF9]/70 text-xs space-y-3"
                      >
                        <div className="flex justify-between items-start font-semibold">
                          <div>
                            <span className="text-[#7B8B98] block text-[11px]">
                              {sc.created_at?.slice(0, 10)}
                            </span>
                            <span className="text-sm font-bold text-[#17324D]">
                              {sc.class_name} ({sc.prediction?.toUpperCase()})
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sc.malignant_referral
                                ? "bg-[#F9ECEE] text-[#7A2E3A] border border-[#E8BCC3]"
                                : "bg-[#EEF7F5] text-[#1F6B58] border border-[#DCE7E5]"
                            }`}
                          >
                            {sc.malignant_referral ? "Requires Review" : "Routine"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {sc.image_b64 && (
                            <div>
                              <span className="text-[10px] text-[#7B8B98] block mb-1 font-semibold">
                                Original Lesion
                              </span>
                              <img
                                src={sc.image_b64.startsWith("data:") ? sc.image_b64 : `data:image/png;base64,${sc.image_b64}`}
                                alt="Lesion"
                                className="w-full aspect-square object-cover rounded-lg border border-[#DCE7E5]"
                              />
                            </div>
                          )}

                          {sc.gradcam_overlay_b64 && (
                            <div>
                              <span className="text-[10px] text-[#7B8B98] block mb-1 font-semibold">
                                Grad-CAM Overlay (45% JET)
                              </span>
                              <img
                                src={`data:image/png;base64,${sc.gradcam_overlay_b64}`}
                                alt="Grad-CAM"
                                className="w-full aspect-square object-cover rounded-lg border border-[#DCE7E5]"
                              />
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-[#5F7182] bg-white p-2.5 rounded-lg border border-[#DCE7E5]/60">
                          <div>Confidence: {(sc.confidence <= 1.0 ? sc.confidence * 100 : sc.confidence).toFixed(1)}%</div>
                          <div>Malignant Probability: {(sc.malignant_prob * 100).toFixed(1)}%</div>
                          {sc.clinical_notes && (
                            <div className="mt-1 text-[#17324D]">
                              <strong>Clinical Notes:</strong> "{sc.clinical_notes}" ({sc.review_status})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: CLINICIAN-ENTERED CARE PLAN (CRITICAL: AI NEVER PRESCRIBES) */}
              <div className="p-5 bg-[#EEF7F5]/50 rounded-2xl border border-[#DCE7E5]/80 space-y-4">
                <div className="flex items-center space-x-2">
                  <Pill className="w-4 h-4 text-[#0F766E]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-teal-950">
                    Clinician-Entered Care Plan & Medication
                  </h4>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-[#DCE7E5] text-[11px] text-teal-900 leading-relaxed">
                  <strong>Clinical Safety Policy:</strong> All treatment plans, prescriptions, and instructions are entered manually by licensed medical staff. The MediMinds AI model never prescribes treatments or medications.
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#5F7182]">Medication & Dosage (Entered by Clinician):</Label>
                    <Input
                      placeholder="e.g. Topical fluorouracil 5% cream twice daily for 2 weeks / High-SPF 50+ broad spectrum mineral sunscreen"
                      value={medicationNotes}
                      onChange={(e) => setMedicationNotes(e.target.value)}
                      className="mt-1 text-xs rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#5F7182]">Care Instructions & Follow-up Details:</Label>
                    <Textarea
                      placeholder="e.g. Monitor lesion diameter and borders. Return immediately if bleeding, ulceration, or rapid growth occurs..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      className="mt-1 text-xs rounded-xl bg-white resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">Follow-up Review Date:</Label>
                      <Input
                        type="date"
                        value={treatmentFollowUpDate}
                        onChange={(e) => setTreatmentFollowUpDate(e.target.value)}
                        className="mt-1 text-xs rounded-xl bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => handleSaveCarePlan(selectedPatientRecord.patient.id)}
                        className="med-btn-primary w-full text-xs font-semibold rounded-xl h-auto"
                      >
                        Record Clinician Care Plan
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Display Existing Care Plans */}
                {selectedPatientRecord.treatments?.length > 0 && (
                  <div className="pt-3 border-t border-[#DCE7E5]/60 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-950 block">
                      Recorded Care Plans:
                    </span>
                    {selectedPatientRecord.treatments.map((t: any) => (
                      <div key={t.id} className="p-3 bg-white rounded-xl border border-[#DCE7E5] text-xs text-[#5F7182] space-y-1">
                        <div className="font-semibold text-[#17324D]">
                          Medication: {t.medication_notes || "None specified"}
                        </div>
                        <p className="text-[#5F7182]">{t.treatment_plan}</p>
                        <div className="text-[10px] text-[#7B8B98]">
                          Logged by: {t.clinician_name || "Clinician"} • Date: {t.start_date}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: APPOINTMENTS SCHEDULING */}
              <div className="p-5 bg-[#EEF7F5] rounded-2xl border border-[#DCE7E5] space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#5F7182]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#17324D]">
                    Schedule In-Person Consultation
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#5F7182]">Date:</Label>
                    <Input
                      type="date"
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      className="mt-1 text-xs rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#5F7182]">Time:</Label>
                    <Input
                      type="time"
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="mt-1 text-xs rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#5F7182]">Purpose of Consultation:</Label>
                  <Input
                    placeholder="e.g. In-person dermoscopy & punch biopsy assessment"
                    value={aptPurpose}
                    onChange={(e) => setAptPurpose(e.target.value)}
                    className="mt-1 text-xs rounded-xl bg-white"
                  />
                </div>

                <Button
                  onClick={() => handleCreateAppointment(selectedPatientRecord.patient.id)}
                  className="w-full bg-[#0F766E] hover:bg-[#0C655E] text-white text-xs font-semibold rounded-xl"
                >
                  Confirm & Schedule Appointment
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setSelectedPatientRecord(null)}
                  className="bg-[#0F766E] text-white text-xs font-semibold px-6 py-2.5 rounded-xl"
                >
                  Close Patient Record
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

export default ProfessionalDashboardPage;
