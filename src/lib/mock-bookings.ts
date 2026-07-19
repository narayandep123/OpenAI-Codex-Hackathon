export interface StoredBooking {
  bookingId: string;
  hospitalId: string;
  hospitalName: string;
  surgeryName: string;
  bookingType: "consultation" | "surgery";
  patientName: string;
  patientAge: number;
  patientLocation: string;
  slot: {
    date: string;
    time: string;
  };
  estimatedCost: number;
  status: "confirmed";
  createdAt: string;
  userId: string;
  userName: string;
}

export const MOCK_USER = {
  id: "mock-user-1",
  name: "Aarav Demo",
};

const BOOKINGS_KEY = "surgifind_mock_bookings";

export function getStoredBookings(): StoredBooking[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY);

    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as StoredBooking[];
  } catch {
    return [];
  }
}

export function saveStoredBookings(bookings: StoredBooking[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function appendStoredBooking(booking: Omit<StoredBooking, "userId" | "userName">) {
  const existing = getStoredBookings();

  const next: StoredBooking[] = [
    {
      ...booking,
      userId: MOCK_USER.id,
      userName: MOCK_USER.name,
    },
    ...existing,
  ];

  saveStoredBookings(next);
}
