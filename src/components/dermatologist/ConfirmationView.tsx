
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Check, Calendar, MapPin } from 'lucide-react';
import { BookingFormData, Dermatologist } from '../../types/dermatologist';
import { useNavigate } from 'react-router-dom';

type ConfirmationViewProps = {
  bookingData: BookingFormData;
  dermatologist: Dermatologist;
};

const ConfirmationView = ({ bookingData, dermatologist }: ConfirmationViewProps) => {
  const navigate = useNavigate();

  const formattedDate = (() => {
    try {
      return format(new Date(bookingData.date), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return bookingData.date;
    }
  })();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center border-b">
        <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-xl">Appointment Confirmed!</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <p className="font-medium">{formattedDate}</p>
              <p className="text-muted-foreground">{bookingData.timeSlot}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <p className="font-medium">{dermatologist.name}</p>
              <p className="text-muted-foreground">{dermatologist.address}</p>
              <p className="text-muted-foreground">{dermatologist.city}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md mt-4">
            <p className="text-sm font-medium">Booking Details</p>
            <p className="text-sm">Name: {bookingData.patientName}</p>
            <p className="text-sm">Email: {bookingData.patientEmail}</p>
            <p className="text-sm">Phone: {bookingData.patientPhone}</p>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4">
            <p>A confirmation email has been sent to {bookingData.patientEmail}</p>
            <p className="mt-2">Please arrive 15 minutes before your appointment.</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        <Button className="w-full" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfirmationView;
