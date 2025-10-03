import type { User, Vehicle, Booking } from './types';
import { add, format } from 'date-fns';

export const users: User[] = [
  { id: 'user-admin-1', name: 'Admin User', email: 'admin@pts.com', role: 'Admin', avatarUrl: 'https://picsum.photos/seed/101/100/100' },
  { id: 'user-dispatcher-1', name: 'Sarah Johnson', email: 'sarah.j@pts.com', role: 'Dispatcher', avatarUrl: 'https://picsum.photos/seed/102/100/100' },
  { id: 'user-dispatcher-2', name: 'Michael Chen', email: 'michael.c@pts.com', role: 'Dispatcher', avatarUrl: 'https://picsum.photos/seed/103/100/100' },
  { id: 'user-driver-1', name: 'John Doe', email: 'john.d@pts.com', role: 'Driver', avatarUrl: 'https://picsum.photos/seed/104/100/100' },
  { id: 'user-driver-2', name: 'Jane Smith', email: 'jane.s@pts.com', role: 'Driver', avatarUrl: 'https://picsum.photos/seed/105/100/100' },
  { id: 'user-driver-3', name: 'Carlos Gomez', email: 'carlos.g@pts.com', role: 'Driver', avatarUrl: 'https://picsum.photos/seed/106/100/100' },
  { id: 'user-accountant-1', name: 'Emily White', email: 'emily.w@pts.com', role: 'Accountant', avatarUrl: 'https://picsum.photos/seed/107/100/100' },
];

export const vehicles: Vehicle[] = [
  { id: 'vehicle-1', make: 'Ford', model: 'Transit', year: 2022, licensePlate: 'FLEET01' },
  { id: 'vehicle-2', make: 'Mercedes-Benz', model: 'Sprinter', year: 2023, licensePlate: 'FLEET02' },
  { id: 'vehicle-3', make: 'Ram', model: 'ProMaster', year: 2021, licensePlate: 'FLEET03' },
];

const today = new Date();
export const bookings: Booking[] = [
  {
    id: 'booking-1',
    customerName: 'Global Tech Inc.',
    pickupAddress: '123 Tech Park, Silicon Valley, CA',
    deliveryAddress: '456 Innovation Dr, San Francisco, CA',
    pickupTime: format(add(today, { hours: 1 }), "yyyy-MM-dd'T'HH:mm"),
    deliveryTime: format(add(today, { hours: 3 }), "yyyy-MM-dd'T'HH:mm"),
    status: 'Pending',
    driverId: 'user-driver-1',
    vehicleId: 'vehicle-1',
  },
  {
    id: 'booking-2',
    customerName: 'Innovate Solutions',
    pickupAddress: '789 Future Way, Palo Alto, CA',
    deliveryAddress: '101 Logic Lane, Mountain View, CA',
    pickupTime: format(add(today, { hours: 2 }), "yyyy-MM-dd'T'HH:mm"),
    deliveryTime: format(add(today, { hours: 4 }), "yyyy-MM-dd'T'HH:mm"),
    status: 'Pending',
    driverId: null,
    vehicleId: null,
  },
  {
    id: 'booking-3',
    customerName: 'Quantum Computing Co.',
    pickupAddress: '234 Circuit Board, San Jose, CA',
    deliveryAddress: '567 Data Stream, Santa Clara, CA',
    pickupTime: format(add(today, { days: -1, hours: -4 }), "yyyy-MM-dd'T'HH:mm"),
    deliveryTime: format(add(today, { days: -1, hours: -2 }), "yyyy-MM-dd'T'HH:mm"),
    status: 'Delivered',
    driverId: 'user-driver-2',
    vehicleId: 'vehicle-2',
  },
   {
    id: 'booking-4',
    customerName: 'NextGen AI',
    pickupAddress: '890 AI Avenue, Stanford, CA',
    deliveryAddress: '123 Machine Learning Rd, Cupertino, CA',
    pickupTime: format(add(today, { hours: -2 }), "yyyy-MM-dd'T'HH:mm"),
    deliveryTime: format(add(today, { hours: 1 }), "yyyy-MM-dd'T'HH:mm"),
    status: 'En Route',
    driverId: 'user-driver-3',
    vehicleId: 'vehicle-3',
  },
  {
    id: 'booking-5',
    customerName: 'BioHealth Corp.',
    pickupAddress: '555 Helix Path, South San Francisco, CA',
    deliveryAddress: '777 Gene Drive, Emeryville, CA',
    pickupTime: format(add(today, { days: 1 }), "yyyy-MM-dd'T'HH:mm"),
    deliveryTime: format(add(today, { days: 1, hours: 3 }), "yyyy-MM-dd'T'HH:mm"),
    status: 'Pending',
    driverId: 'user-driver-1',
    vehicleId: 'vehicle-1',
  },
];
