
import { Dermatologist, AppointmentDay } from '../types/dermatologist';

export const dermatologists: Dermatologist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Dermatologic Surgery',
    address: '123 Medical Center Dr',
    city: 'New York, NY',
    rating: 4.8,
    image: '/placeholder.svg',
    bio: 'Dr. Johnson is a board-certified dermatologist specializing in skin cancer detection and treatment. With over 15 years of experience, she provides comprehensive care for various skin conditions.',
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Pediatric Dermatology',
    address: '456 Health Parkway',
    city: 'Boston, MA',
    rating: 4.7,
    image: '/placeholder.svg',
    bio: 'Dr. Chen is an expert in treating skin conditions for patients of all ages, with special focus on pediatric dermatology and eczema management.',
  },
  {
    id: '3',
    name: 'Dr. Amara Patel',
    specialty: 'Cosmetic Dermatology',
    address: '789 Wellness Blvd',
    city: 'San Francisco, CA',
    rating: 4.9,
    image: '/placeholder.svg',
    bio: 'Dr. Patel combines her expertise in medical dermatology with advanced cosmetic procedures to help patients achieve healthier skin.',
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    specialty: 'Medical Dermatology',
    address: '321 Care Street',
    city: 'Chicago, IL',
    rating: 4.6,
    image: '/placeholder.svg',
    bio: 'Dr. Wilson specializes in treating complex skin conditions including psoriasis, severe acne, and rare skin disorders.',
  },
  {
    id: '5',
    name: 'Dr. Lisa Rodriguez',
    specialty: 'Dermatopathology',
    address: '567 Health Sciences Way',
    city: 'Miami, FL',
    rating: 4.5,
    image: '/placeholder.svg',
    bio: 'As both a dermatologist and pathologist, Dr. Rodriguez provides expert diagnosis and treatment plans based on precise analysis of skin tissues.',
  },
];

// Generate some mock appointment slots for the next 7 days
export const generateAvailableDays = (dermatologistId: string): AppointmentDay[] => {
  const days: AppointmentDay[] = [];
  const today = new Date();
  
  // Generate slots for the next 7 days
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() + i);
    
    // Don't add weekend days
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    // Create time slots every 30 minutes
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        // Randomly mark some slots as unavailable
        const available = Math.random() > 0.3;
        
        slots.push({
          id: `${hour}-${min}`,
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          available,
        });
      }
    }
    
    days.push({
      date: currentDate.toISOString().split('T')[0],
      dayName: dayNames[currentDate.getDay()],
      slots,
    });
  }
  
  return days;
};

// Function to simulate finding dermatologists near a location
export const findNearbyDermatologists = (
  zipCode: string,
  maxDistance: number = 20
): Dermatologist[] => {
  // In a real app, we would make an API call to find doctors near the zip code
  // For now, we'll just return our mock data with random distances
  return dermatologists.map(derm => ({
    ...derm,
    distance: Math.floor(Math.random() * maxDistance) + 1
  })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
};
