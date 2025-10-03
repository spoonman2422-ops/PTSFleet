
import type { Vehicle } from './types';

export const users = []; // This is now fetched from Firestore

export const vehicles: Vehicle[] = [
  { id: 'vehicle-1', make: 'Ford', model: 'Transit', year: 2022, licensePlate: 'FLEET01' },
  { id: 'vehicle-2', make: 'Mercedes-Benz', model: 'Sprinter', year: 2023, licensePlate: 'FLEET02' },
  { id: 'vehicle-3', make: 'Ram', model: 'ProMaster', year: 2021, licensePlate: 'FLEET03' },
];

export const bookings = []; // This is now fetched from Firestore
