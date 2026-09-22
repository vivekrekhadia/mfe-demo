export interface Guest {
  id: string;
  name: string;
  age: number;
}

export interface Booking {
  cabin: string;
  cabinSlug: string;
  checkIn: string;
  checkOut: string;
  guests: Guest[];
}

// In-memory demo data. A real implementation would fetch this from an API;
// nothing about the sub-routing below depends on where it comes from.
export const bookings: Booking[] = [
  {
    cabin: "Cabin 1204",
    cabinSlug: "1204",
    checkIn: "20 Sep",
    checkOut: "27 Sep",
    guests: [
      { id: "g1", name: "J. Rivera", age: 34 },
      { id: "g2", name: "M. Rivera", age: 32 },
    ],
  },
];

export function findBookingBySlug(cabinSlug: string): Booking | undefined {
  return bookings.find((b) => b.cabinSlug === cabinSlug);
}
