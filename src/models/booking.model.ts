
export interface Customer {
  id: string;
  fullName: string;
  idNumber: string; // Should be encrypted in a real app
  phoneNumber: string;
  email?: string;
}

export type BookingStatus = 'ממתין לאישור לקוח' | 'הזמנה מאושרת' | 'הושלמה' | 'בוטלה';

export interface Booking {
  id: string;
  customer: Customer;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  notes?: string;
  totalAmount: number;
  depositPaid: number;
  status: BookingStatus;
  signature?: string; // a data URL of the signature image
  createdAt: Date;
}
