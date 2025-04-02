
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BookAppointmentPage = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState("");
  const [specialist, setSpecialist] = useState("");
  const [appointmentType, setAppointmentType] = useState("inperson");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !timeSlot || !specialist) {
      toast.error("Please fill in all fields");
      return;
    }
    
    // In a real app, this would send the data to a server
    console.log({
      date,
      timeSlot,
      specialist,
      appointmentType
    });
    
    toast.success("Appointment booked successfully!");
    
    // Reset form
    setDate(undefined);
    setTimeSlot("");
    setSpecialist("");
    setAppointmentType("inperson");
  };

  // Mock data for specialists
  const specialists = [
    { id: "1", name: "Dr. Emily Johnson", specialty: "Dermatology" },
    { id: "2", name: "Dr. Michael Smith", specialty: "Dermatology" },
    { id: "3", name: "Dr. Sarah Williams", specialty: "Dermatology" },
    { id: "4", name: "Dr. Robert Davis", specialty: "Dermatology" },
  ];

  // Mock data for time slots
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Book an Appointment</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="bg-mediminds-blue text-white">
                  <CardTitle>Schedule Your Visit</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="specialist">Select Specialist</Label>
                      <Select value={specialist} onValueChange={setSpecialist}>
                        <SelectTrigger id="specialist">
                          <SelectValue placeholder="Choose a specialist" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialists.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name} - {doc.specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Appointment Type</Label>
                      <RadioGroup 
                        value={appointmentType} 
                        onValueChange={setAppointmentType}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inperson" id="inperson" />
                          <Label htmlFor="inperson">In-Person Visit</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="video" id="video" />
                          <Label htmlFor="video">Video Consultation</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        disabled={(date) => {
                          // Disable past dates and weekends
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          const day = date.getDay();
                          return date < now || day === 0 || day === 6;
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeslot">Select Time Slot</Label>
                      <Select value={timeSlot} onValueChange={setTimeSlot} disabled={!date}>
                        <SelectTrigger id="timeslot">
                          <SelectValue placeholder="Choose a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Special Notes (Optional)</Label>
                      <Input id="notes" placeholder="Any specific concerns or requirements" />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-mediminds-blue hover:bg-mediminds-darkblue"
                    >
                      Confirm Appointment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader className="bg-mediminds-darkblue text-white">
                  <CardTitle>Appointment Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">What to Expect</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        During your appointment, the dermatologist will examine your skin concern and provide a professional diagnosis and treatment plan.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Preparation</h3>
                      <ul className="text-sm text-gray-600 mt-1 space-y-1 list-disc pl-5">
                        <li>Bring your MediMinds assessment results</li>
                        <li>Remove makeup from the affected area</li>
                        <li>Bring a list of current medications</li>
                        <li>Arrive 15 minutes early for in-person visits</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Cancellation Policy</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Please provide at least 24 hours notice for cancellations or rescheduling to avoid a cancellation fee.
                      </p>
                    </div>
                    
                    <div className="bg-mediminds-blue/10 p-3 rounded">
                      <h3 className="font-medium text-mediminds-darkblue">Insurance</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        We accept most major insurance plans. Please bring your insurance card to your appointment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookAppointmentPage;
