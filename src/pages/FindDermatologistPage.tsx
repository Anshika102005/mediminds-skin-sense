
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { findNearbyDermatologists } from '../data/dermatologists';
import { BookingFormData, Dermatologist } from '../types/dermatologist';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchForm from '../components/dermatologist/SearchForm';
import DermatologistCard from '../components/dermatologist/DermatologistCard';
import AppointmentPicker from '../components/dermatologist/AppointmentPicker';
import BookingForm from '../components/dermatologist/BookingForm';
import ConfirmationView from '../components/dermatologist/ConfirmationView';

type BookingStep = 'search' | 'select-time' | 'booking-form' | 'confirmation';

const FindDermatologistPage = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>('search');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [dermatologists, setDermatologists] = useState<Dermatologist[]>([]);
  const [selectedDermatologist, setSelectedDermatologist] = useState<Dermatologist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);

  const handleSearch = (location: string, distance: number) => {
    try {
      const results = findNearbyDermatologists(location, distance);
      setDermatologists(results);
      setSearchPerformed(true);
      
      toast({
        title: "Search Complete",
        description: `Found ${results.length} dermatologists near ${location}.`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to find dermatologists. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectDermatologist = (dermatologist: Dermatologist) => {
    setSelectedDermatologist(dermatologist);
    setStep('select-time');
    window.scrollTo(0, 0);
  };

  const handleTimeSelected = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('booking-form');
    window.scrollTo(0, 0);
  };

  const handleBookingSubmit = (data: BookingFormData) => {
    // In a real app, we would make an API call to save the booking
    setBookingData(data);
    setStep('confirmation');
    window.scrollTo(0, 0);
    
    toast({
      title: "Appointment Booked!",
      description: "Your appointment has been successfully scheduled.",
    });
  };

  const handleBackToSearch = () => {
    setStep('search');
    setSelectedDermatologist(null);
  };

  const handleBackToTimeSelection = () => {
    setStep('select-time');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Find a Dermatologist</h1>
        <p className="text-muted-foreground mb-8">
          Search for dermatologists in your area and book an appointment online.
        </p>
        
        {step === 'search' && (
          <div>
            <div className="mb-8">
              <SearchForm onSearch={handleSearch} />
            </div>
            
            {searchPerformed && (
              <div>
                {dermatologists.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      {dermatologists.length} Dermatologists Found
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dermatologists.map((dermatologist) => (
                        <DermatologistCard
                          key={dermatologist.id}
                          dermatologist={dermatologist}
                          onSelectDermatologist={handleSelectDermatologist}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                      No dermatologists found matching your criteria.
                    </p>
                    <p className="text-muted-foreground">
                      Please try expanding your search radius or try a different location.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {step === 'select-time' && selectedDermatologist && (
          <div className="max-w-3xl mx-auto">
            <AppointmentPicker
              dermatologist={selectedDermatologist}
              onTimeSelected={handleTimeSelected}
              onBack={handleBackToSearch}
            />
          </div>
        )}
        
        {step === 'booking-form' && selectedDermatologist && (
          <div className="max-w-3xl mx-auto">
            <BookingForm
              dermatologist={selectedDermatologist}
              appointmentDate={selectedDate}
              appointmentTime={selectedTime}
              onSubmit={handleBookingSubmit}
              onBack={handleBackToTimeSelection}
            />
          </div>
        )}
        
        {step === 'confirmation' && bookingData && selectedDermatologist && (
          <div>
            <ConfirmationView
              bookingData={bookingData}
              dermatologist={selectedDermatologist}
            />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default FindDermatologistPage;
