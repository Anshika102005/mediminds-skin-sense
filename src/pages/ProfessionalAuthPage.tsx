import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Building, Lock } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

export const ProfessionalAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regForm, setRegForm] = useState({
    org_name: "",
    org_address: "",
    org_city: "",
    org_state: "",
    full_name: "",
    email: "",
    password: "",
    role_title: "Doctor",
    license_id: "",
    department: "Dermatology",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!res.ok) {
        toast.error("Invalid credentials.");
        return;
      }
      const data = await res.json();
      login(data.user);
      toast.success(`Welcome, ${data.user.full_name}`);
      navigate("/professional/dashboard");
    } catch {
      toast.error("Unable to connect to service.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/professional`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      if (!res.ok) {
        toast.error("Registration failed. Email might already exist.");
        return;
      }
      const data = await res.json();
      login({
        id: data.user_id,
        email: regForm.email,
        full_name: data.full_name,
        role: data.role,
        professional_id: data.professional_id,
        org_id: data.org_id,
        org_name: data.org_name,
        role_title: regForm.role_title,
        department: regForm.department,
      });
      toast.success("Organization & professional registered.");
      navigate("/professional/dashboard");
    } catch {
      toast.error("Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />
      <main className="flex-1 med-container py-12 flex items-center justify-center">
        <Card className="max-w-xl w-full p-8 bg-white border border-[#DCE7E5] shadow-lg rounded-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#17324D]">
              Healthcare Organization & Clinician Portal
            </h1>
            <p className="text-xs text-[#7B8B98] mt-1">
              Secure authentication for doctors, nurses, and authorized hospital staff.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-xs">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="text-xs">Register Organization</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="doctor@hospital.org"
                    className="text-xs mt-1"
                  />
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="p-3 bg-[#F7FAF9] rounded-lg border border-[#DCE7E5] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#17324D]">
                    <Building className="w-4 h-4 text-[#0F766E]" />
                    <span>Hospital / Healthcare Organization</span>
                  </div>
                  <div>
                    <Label className="text-[11px]">Organization Name</Label>
                    <Input
                      required
                      placeholder="e.g. City Hospital / Health Center"
                      value={regForm.org_name}
                      onChange={(e) => setRegForm({ ...regForm, org_name: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">City</Label>
                      <Input
                        required
                        placeholder="City"
                        value={regForm.org_city}
                        onChange={(e) => setRegForm({ ...regForm, org_city: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">State</Label>
                      <Input
                        required
                        placeholder="State"
                        value={regForm.org_state}
                        onChange={(e) => setRegForm({ ...regForm, org_state: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#F7FAF9] rounded-lg border border-[#DCE7E5] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#17324D]">
                    <Stethoscope className="w-4 h-4 text-[#0F766E]" />
                    <span>Professional Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Full Name</Label>
                      <Input
                        required
                        placeholder="Dr. Full Name"
                        value={regForm.full_name}
                        onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Role</Label>
                      <Select
                        value={regForm.role_title}
                        onValueChange={(val) => setRegForm({ ...regForm, role_title: val })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Doctor">Doctor / Dermatologist</SelectItem>
                          <SelectItem value="Nurse">Registered Nurse</SelectItem>
                          <SelectItem value="Authorized Healthcare Staff">Authorized Healthcare Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">License ID</Label>
                      <Input
                        required
                        placeholder="MED-84920"
                        value={regForm.license_id}
                        onChange={(e) => setRegForm({ ...regForm, license_id: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Department</Label>
                      <Input
                        required
                        placeholder="Dermatology"
                        value={regForm.department}
                        onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Email</Label>
                      <Input
                        type="email"
                        required
                        placeholder="doctor@hospital.org"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Password</Label>
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#0F766E] text-white text-xs py-2.5">
                  Register Healthcare Organization & Account
                </Button>
              </form>
            </TabsContent>

                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <Input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-xs mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#0F766E] text-white text-xs py-2.5 mt-2">
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Sign In to Clinical Portal
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfessionalAuthPage;
