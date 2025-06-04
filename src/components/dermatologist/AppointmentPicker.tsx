
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentDay, Dermatologist, TimeSlot } from '../../types/dermatologist';
import { generateAvailableDays } from '../../data/dermatologists';

type AppointmentPickerProps = {
  dermatologist: Dermatologist;
  onTimeSelected: (date: string, timeSlot: string) => void;
  onBack: () => void;
};

const AppointmentPicker = ({ 
  dermatologist, 
  onTimeSelected,
  onBack
}: AppointmentPickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableDays, setAvailableDays] = useState<AppointmentDay[]>(() => 
    generateAvailableDays(dermatologist.id)
  );

  const formattedSelectedDate = selectedDate 
    ? format(selectedDate, 'yyyy-MM-dd')
    : '';
    
  const selectedDay = availableDays.find(day => day.date === formattedSelectedDate);
  
  const handleSelectTime = (time: string) => {
    setSelectedTimeSlot(time);
  };
  
  const handleConfirm = () => {
    if (selectedDate && selectedTimeSlot) {
      onTimeSelected(format(selectedDate, 'yyyy-MM-dd'), selectedTimeSlot);
    }
  };

  // Filter out weekend days and past dates
  const isDateAvailable = (date: Date): boolean => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Exclude weekends (0 is Sunday, 6 is Saturday)
    if (day === 0 || day === 6) {
      return false;
    }
    
    // Exclude past dates
    if (date < today) {
      return false;
    }
    
    return true;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book Appointment with {dermatologist.name}</CardTitle>
        <CardDescription>{dermatologist.specialty}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calendar">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">Select Date</TabsTrigger>
            <TabsTrigger value="times" disabled={!selectedDate}>Available Times</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="pt-2">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={date => !isDateAvailable(date)}
                className="rounded-md border"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="times">
            {selectedDay ? (
              <div>
                <h3 className="font-medium mb-3">
                  Available times for {format(selectedDate as Date, 'EEEE, MMMM d, yyyy')}:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {selectedDay.slots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                      disabled={!slot.available}
                      onClick={() => handleSelectTime(slot.time)}
                      className="text-center"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
                {selectedDay.slots.every(slot => !slot.available) && (
                  <p className="text-center py-4 text-muted-foreground">
                    No available appointments on this day.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Please select a valid date first.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to List
        </Button>
        <Button 
          disabled={!selectedDate || !selectedTimeSlot}
          onClick={handleConfirm}
        >
          Confirm Time
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AppointmentPicker;
