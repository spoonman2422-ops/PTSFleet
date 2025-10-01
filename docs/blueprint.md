# **App Name**: PTSFleetSystem

## Core Features:

- User Authentication: Secure user authentication system with roles for Admin, Dispatcher, and Driver.
- Booking Management: Dispatcher interface to create, edit, and cancel bookings, assign drivers and vehicles, and manage pickup/delivery details.
- Driver App: Simplified driver app for viewing assigned bookings and updating booking status (pending, en route, delivered).
- Dispatcher Dashboard: Dashboard view for dispatchers to see and filter today’s bookings by status.
- Data Storage with Firestore: Utilize Firestore collections to store user roles/profiles, booking assignments linked to drivers and vehicles, and basic vehicle information.
- Push Notifications: Push notification to driver when a new booking is assigned

## Style Guidelines:

- Primary color: Deep navy blue (#1A237E) to convey professionalism and reliability, fitting for logistics management.
- Background color: Very light gray (#F5F5F5), a desaturated hue similar to the primary, provides a clean, neutral backdrop.
- Accent color: Soft periwinkle (#7986CB), an analogous color, serves to highlight key actions and information.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern look.
- Clear, universal icons to represent booking status, vehicle types, and user roles.
- Clean, card-based layout for bookings, and tabular layout for the Dispatcher Dashboard
- Subtle transition animations for booking status updates to provide clear user feedback.