
import React from 'react';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const searchFormSchema = z.object({
  location: z.string().min(5, { message: "Please enter a valid location" }),
  distance: z.string().optional(),
});

type SearchFormProps = {
  onSearch: (location: string, distance: number) => void;
};

const SearchForm = ({ onSearch }: SearchFormProps) => {
  const form = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      location: '',
      distance: '10',
    },
  });

  const handleSubmit = (data: z.infer<typeof searchFormSchema>) => {
    onSearch(
      data.location, 
      data.distance ? parseInt(data.distance, 10) : 10
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Your Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter ZIP code or city" 
                    className="pl-9" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="distance"
          render={({ field }) => (
            <FormItem className="w-32">
              <FormLabel>Distance (miles)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="100" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto">
          <Search className="mr-2 h-4 w-4" /> Find Dermatologists
        </Button>
      </form>
    </Form>
  );
};

export default SearchForm;
