import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Stethoscope, ShieldCheck, Lock, Mail, Building, Phone, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, isProfessional } = useAuth();
  const { t, language } = useLanguage();

  const initialRole = searchParams.get("role") === "professional" ? "professional" : "patient";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const redirectTarget = searchParams.get("redirect") || "";

  const [role, setRole] = useState<"patient" | "professional">(initialRole);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);

  // Patient Login Form
  const [patientLoginEmail, setPatientLoginEmail] = useState("");
  const [patientLoginPassword, setPatientLoginPassword] = useState("");

  // Patient Register Form
  const [patientReg, setPatientReg] = useState({
    fullName: "",
    age: "",
    gender: "female",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Professional Login Form
  const [profLoginEmail, setProfLoginEmail] = useState("");
  const [profLoginPassword, setProfLoginPassword] = useState("");

  // Professional Register Form
  const [profReg, setProfReg] = useState({
    orgName: "",
    orgAddress: "",
    orgCity: "",
    orgState: "",
    orgPhone: "",
    fullName: "",
    email: "",
    phone: "",
    roleTitle: "Doctor",
    licenseId: "",
    department: "Dermatology",
    specialization: "General Dermatology & Oncology Triage",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (redirectTarget) {
        navigate(redirectTarget);
      } else if (isProfessional) {
        navigate("/professional/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    }
  }, [isAuthenticated, isProfessional, navigate, redirectTarget]);

  // Handle Patient Login
  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: patientLoginEmail.trim(),
          password: patientLoginPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.user?.role !== "patient") {
        toast.error("This account is registered as healthcare staff. Please switch to the Clinician tab.");
        setRole("professional");
        setLoading(false);
        return;
      }

      login(data.user);
      toast.success(`Welcome back, ${data.user.full_name}!`);
      navigate(redirectTarget || "/patient/dashboard");
    } catch {
      toast.error("Authentication service unavailable. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Patient Registration
  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patientReg.password !== patientReg.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (patientReg.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: patientReg.fullName.trim(),
          age: parseInt(patientReg.age) || 30,
          gender: patientReg.gender,
          email: patientReg.email.trim(),
          password: patientReg.password,
          phone: patientReg.phone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Registration failed. An account with this email may already exist.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      login({
        id: data.user_id,
        email: patientReg.email,
        full_name: data.full_name,
        role: "patient",
        patient_id: data.patient_id,
      });

      toast.success("Patient account created successfully!");
      navigate(redirectTarget || "/patient/dashboard");
    } catch {
      toast.error("Registration service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Professional Login
  const handleProfLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profLoginEmail.trim(),
          password: profLoginPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Invalid credentials.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.user?.role === "patient") {
        toast.error("This account is registered as a patient. Please switch to the Patient tab.");
        setRole("patient");
        setLoading(false);
        return;
      }

      login(data.user);
      toast.success(`Welcome, ${data.user.full_name}`);
      navigate("/professional/dashboard");
    } catch {
      toast.error("Unable to connect to service.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Professional Registration
  const handleProfRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profReg.password !== profReg.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (profReg.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/professional`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: profReg.orgName.trim(),
          org_address: profReg.orgAddress.trim(),
          org_city: profReg.orgCity.trim(),
          org_state: profReg.orgState.trim(),
          org_phone: profReg.orgPhone.trim() || undefined,
          full_name: profReg.fullName.trim(),
          email: profReg.email.trim(),
          phone: profReg.phone.trim() || undefined,
          role_title: profReg.roleTitle,
          license_id: profReg.licenseId.trim(),
          department: profReg.department.trim(),
          specialization: profReg.specialization.trim(),
          password: profReg.password,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Registration failed. An account with this email may already exist.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      login({
        id: data.user_id,
        email: profReg.email,
        full_name: data.full_name,
        role: data.role,
        professional_id: data.professional_id,
        org_id: data.org_id,
        org_name: data.org_name,
        role_title: profReg.roleTitle,
        department: profReg.department,
      });

      toast.success("Professional account & organization registered successfully!");
      navigate("/professional/dashboard");
    } catch {
      toast.error("Registration service failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="flex-1 med-container py-12 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Header Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-[#EEF7F5] border border-[#DCE7E5] px-3 py-1 rounded-full text-xs font-semibold text-[#17324D] mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{language === "hi" ? "मेडिमाइंड्स स्किन सेंस • सुरक्षित प्रवेश" : "MediMinds Skin Sense • Secure Authentication"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] tracking-tight">
              {mode === "login"
                ? language === "hi"
                  ? "पोर्टल में प्रवेश करें"
                  : "Sign In to Your Account"
                : language === "hi"
                ? "नया खाता बनाएँ"
                : "Create Your Account"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8B98] mt-1 max-w-md mx-auto">
              {language === "hi"
                ? "त्वचा स्क्रीनिंग, Grad-CAM हीटमैप और पेशेवर समीक्षा तक पहुँचने के लिए अपनी भूमिका चुनें।"
                : "Select your role to access AI-assisted skin screening, explainable heatmaps, and longitudinal records."}
            </p>
          </div>

          <Card className="bg-white border border-[#DCE7E5] shadow-md rounded-2xl p-6 sm:p-8">
            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#EEF7F5] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  role === "patient"
                    ? "bg-white text-[#17324D] shadow-sm"
                    : "text-[#5F7182] hover:text-[#17324D]"
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{t("authPatientTab")}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("professional")}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  role === "professional"
                    ? "bg-white text-[#17324D] shadow-sm"
                    : "text-[#5F7182] hover:text-[#17324D]"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#2A9D8F]" />
                <span>{t("authProfTab")}</span>
              </button>
            </div>

            {/* Mode Switcher (Sign In vs Register) */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#DCE7E5] text-xs">
              <span className="font-semibold text-[#5F7182]">
                {role === "patient" ? "Patient Access" : "Healthcare Professional Access"}
              </span>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`font-semibold pb-1 transition-colors ${
                    mode === "login"
                      ? "text-[#17324D] border-b-2 border-slate-900"
                      : "text-[#7B8B98] hover:text-[#5F7182]"
                  }`}
                >
                  {t("authSignIn")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`font-semibold pb-1 transition-colors ${
                    mode === "register"
                      ? "text-[#17324D] border-b-2 border-slate-900"
                      : "text-[#7B8B98] hover:text-[#5F7182]"
                  }`}
                >
                  {t("authCreateAccount")}
                </button>
              </div>
            </div>

            {/* PATIENT ROLE FORMS */}
            {role === "patient" && (
              <>
                {mode === "login" ? (
                  <form onSubmit={handlePatientLogin} className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authEmail")}</Label>
                      <Input
                        type="email"
                        required
                        placeholder="patient@example.com"
                        value={patientLoginEmail}
                        onChange={(e) => setPatientLoginEmail(e.target.value)}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authPassword")}</Label>
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={patientLoginPassword}
                        onChange={(e) => setPatientLoginPassword(e.target.value)}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#0F766E] hover:bg-[#0C655E] text-white font-medium py-3 rounded-xl text-xs mt-2"
                    >
                      {loading ? "Authenticating..." : t("authSignInBtn")}
                    </Button>

                    <div className="text-center pt-2 text-xs text-[#7B8B98]">
                      <span>{t("authNoAccount")} </span>
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-[#0F766E] font-semibold hover:underline"
                      >
                        {t("authCreateAccount")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePatientRegister} className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authFullName")}</Label>
                      <Input
                        required
                        placeholder="Full Name"
                        value={patientReg.fullName}
                        onChange={(e) => setPatientReg({ ...patientReg, fullName: e.target.value })}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authAge")}</Label>
                        <Input
                          type="number"
                          required
                          min="1"
                          max="120"
                          placeholder="Age"
                          value={patientReg.age}
                          onChange={(e) => setPatientReg({ ...patientReg, age: e.target.value })}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authGender")}</Label>
                        <Select
                          value={patientReg.gender}
                          onValueChange={(val) => setPatientReg({ ...patientReg, gender: val })}
                        >
                          <SelectTrigger className="mt-1 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">{t("authGenderFemale")}</SelectItem>
                            <SelectItem value="male">{t("authGenderMale")}</SelectItem>
                            <SelectItem value="other">{t("authGenderOther")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authEmail")}</Label>
                      <Input
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={patientReg.email}
                        onChange={(e) => setPatientReg({ ...patientReg, email: e.target.value })}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authPhone")}</Label>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={patientReg.phone}
                        onChange={(e) => setPatientReg({ ...patientReg, phone: e.target.value })}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authPassword")}</Label>
                        <Input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={patientReg.password}
                          onChange={(e) => setPatientReg({ ...patientReg, password: e.target.value })}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authConfirmPassword")}</Label>
                        <Input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={patientReg.confirmPassword}
                          onChange={(e) => setPatientReg({ ...patientReg, confirmPassword: e.target.value })}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#0F766E] hover:bg-[#0C655E] text-white font-medium py-3 rounded-xl text-xs mt-2"
                    >
                      {loading ? "Registering..." : t("authRegisterBtn")}
                    </Button>

                    <div className="text-center pt-2 text-xs text-[#7B8B98]">
                      <span>{t("authHaveAccount")} </span>
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-[#0F766E] font-semibold hover:underline"
                      >
                        {t("authSignIn")}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* HEALTHCARE PROFESSIONAL ROLE FORMS */}
            {role === "professional" && (
              <>
                {mode === "login" ? (
                  <form onSubmit={handleProfLogin} className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authEmail")}</Label>
                      <Input
                        type="email"
                        required
                        placeholder="doctor@hospital.org"
                        value={profLoginEmail}
                        onChange={(e) => setProfLoginEmail(e.target.value)}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#5F7182]">{t("authPassword")}</Label>
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={profLoginPassword}
                        onChange={(e) => setProfLoginPassword(e.target.value)}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#0F766E] hover:bg-[#0C655E] text-white font-medium py-3 rounded-xl text-xs mt-2"
                    >
                      {loading ? "Authenticating..." : "Sign In to Clinician Portal"}
                    </Button>

                    <div className="text-center pt-2 text-xs text-[#7B8B98]">
                      <span>{t("authNoAccount")} </span>
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-[#0F766E] font-semibold hover:underline"
                      >
                        Register Healthcare Staff
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleProfRegister} className="space-y-4">
                    <div className="p-3 bg-[#F7FAF9] border border-[#DCE7E5] rounded-xl space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7182] block">
                        Hospital / Healthcare Center Details
                      </span>
                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authOrgName")}</Label>
                        <Input
                          required
                          placeholder="e.g. City Health Clinic / Metro Hospital"
                          value={profReg.orgName}
                          onChange={(e) => setProfReg({ ...profReg, orgName: e.target.value })}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authOrgCity")}</Label>
                          <Input
                            required
                            placeholder="City"
                            value={profReg.orgCity}
                            onChange={(e) => setProfReg({ ...profReg, orgCity: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authOrgState")}</Label>
                          <Input
                            required
                            placeholder="State"
                            value={profReg.orgState}
                            onChange={(e) => setProfReg({ ...profReg, orgState: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authOrgAddress")}</Label>
                        <Input
                          required
                          placeholder="Street Address"
                          value={profReg.orgAddress}
                          onChange={(e) => setProfReg({ ...profReg, orgAddress: e.target.value })}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7182] block">
                        Clinician Credentials
                      </span>

                      <div>
                        <Label className="text-xs font-semibold text-[#5F7182]">{t("authFullName")}</Label>
                        <Input
                          required
                          placeholder="Dr. John Doe"
                          value={profReg.fullName}
                          onChange={(e) => setProfReg({ ...profReg, fullName: e.target.value })}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authRoleTitle")}</Label>
                          <Select
                            value={profReg.roleTitle}
                            onValueChange={(val) => setProfReg({ ...profReg, roleTitle: val })}
                          >
                            <SelectTrigger className="mt-1 text-xs rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Doctor">{t("authRoleDoctor")}</SelectItem>
                              <SelectItem value="Nurse">{t("authRoleNurse")}</SelectItem>
                              <SelectItem value="Authorized Healthcare Staff">{t("authRoleStaff")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authLicenseId")}</Label>
                          <Input
                            required
                            placeholder="MCI-12345 or ID"
                            value={profReg.licenseId}
                            onChange={(e) => setProfReg({ ...profReg, licenseId: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authDepartment")}</Label>
                          <Input
                            required
                            placeholder="Dermatology / Triage"
                            value={profReg.department}
                            onChange={(e) => setProfReg({ ...profReg, department: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authSpecialization")}</Label>
                          <Input
                            placeholder="Skin Health / General"
                            value={profReg.specialization}
                            onChange={(e) => setProfReg({ ...profReg, specialization: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authEmail")}</Label>
                          <Input
                            type="email"
                            required
                            placeholder="name@hospital.org"
                            value={profReg.email}
                            onChange={(e) => setProfReg({ ...profReg, email: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authPhone")}</Label>
                          <Input
                            type="tel"
                            placeholder="+91..."
                            value={profReg.phone}
                            onChange={(e) => setProfReg({ ...profReg, phone: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authPassword")}</Label>
                          <Input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={profReg.password}
                            onChange={(e) => setProfReg({ ...profReg, password: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-[#5F7182]">{t("authConfirmPassword")}</Label>
                          <Input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={profReg.confirmPassword}
                            onChange={(e) => setProfReg({ ...profReg, confirmPassword: e.target.value })}
                            className="mt-1 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#0F766E] hover:bg-[#0C655E] text-white font-medium py-3 rounded-xl text-xs mt-2"
                    >
                      {loading ? "Registering Organization..." : "Register Professional Account"}
                    </Button>

                    <div className="text-center pt-2 text-xs text-[#7B8B98]">
                      <span>{t("authHaveAccount")} </span>
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-[#0F766E] font-semibold hover:underline"
                      >
                        {t("authSignIn")}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
