
import React from 'react';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingFormData, Dermatologist } from '../../types/dermatologist';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';

const bookingFormSchema = z.object({
  patientName: z.string().min(3, { message: "Name is required" }),
  patientEmail: z.string().email({ message: "Valid email is required" }),
  patientPhone: z.string().min(10, { message: "Valid phone number is required" }),
  reason: z.string().min(10, { message: "Please provide a reason for your visit" }),
});

type BookingFormProps = {
  dermatologist: Dermatologist;
  appointmentDate: string;
  appointmentTime: string;
  onSubmit: (data: BookingFormData) => void;
  onBack: () => void;
};

const BookingForm = ({ 
  dermatologist, 
  appointmentDate, 
  appointmentTime,
  onSubmit,
  onBack
}: BookingFormProps) => {
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      reason: '',
    },
  });

  const handleSubmit = (data: z.infer<typeof bookingFormSchema>) => {
    onSubmit({
      dermatologistId: dermatologist.id,
      date: appointmentDate,
      timeSlot: appointmentTime,
      ...data
    });
  };

  const formattedDate = (() => {
    try {
      return format(new Date(appointmentDate), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return appointmentDate;
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
          <p className="font-medium">Appointment Details</p>
          <p className="text-sm text-muted-foreground">With {dermatologist.name}</p>
          <p className="text-sm text-muted-foreground">{formattedDate} at {appointmentTime}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please briefly describe the reason for your visit" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This helps the dermatologist prepare for your appointment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={onBack} type="button">
                Back
              </Button>
              <Button type="submit">
                Confirm Booking
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
