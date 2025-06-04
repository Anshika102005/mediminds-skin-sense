
export interface Dermatologist {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  distance?: number;
  rating: number;
  image: string;
  bio: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface AppointmentDay {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

export interface BookingFormData {
  dermatologistId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  timeSlot: string;
  reason: string;
}
