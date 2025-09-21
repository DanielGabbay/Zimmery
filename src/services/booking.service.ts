
import { Injectable, signal, inject } from '@angular/core';
import { Booking, Customer } from '../models/booking.model';
import { SupabaseService } from './supabase.service';
import { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private supabase: SupabaseClient | null = inject(SupabaseService).supabase;
  private bookings = signal<Booking[]>([]);

  allBookings = this.bookings.asReadonly();
  
  constructor() {
    if (this.supabase) {
        this.loadBookings();
    }
  }

  private async loadBookings() {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
      return;
    }
    if (data) {
        this.bookings.set(this.mapBookings(data));
    }
  }
  
  private mapBookings(data: any[]): Booking[] {
    return data.map(b => this.mapBooking(b));
  }

  private mapBooking(b: any): Booking {
    if (!b) return b;
    const customer = b.customer || {};
    return {
        id: b.id,
        checkInDate: b.check_in_date,
        checkOutDate: b.check_out_date,
        adults: b.adults,
        children: b.children,
        notes: b.notes,
        totalAmount: b.total_amount,
        depositPaid: b.deposit_paid,
        status: b.status,
        signature: b.signature,
        createdAt: new Date(b.created_at),
        customer: {
            id: customer.id,
            fullName: customer.full_name,
            idNumber: customer.id_number,
            phoneNumber: customer.phone_number,
            email: customer.email,
        }
    };
  }

  async getBookingById(id: string): Promise<Booking | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching booking ${id}:`, error);
      return null;
    }
    return this.mapBooking(data);
  }

  // Fix: The parameter type for `addBooking` was too strict. It now accepts a customer object
  // without an 'id' property, which is correct for new bookings where the customer might not exist yet.
  async addBooking(bookingData: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customer'> & { customer: Omit<Customer, 'id'> }): Promise<Booking | null> {
    if (!this.supabase) return null;
    
    // First, try to find existing customer
    const existingCustomer = await this.findCustomer(bookingData.customer.idNumber, bookingData.customer.phoneNumber);
    
    let customerId: string;
    
    if (existingCustomer) {
      // Customer exists, use their ID
      customerId = existingCustomer.id!;
    } else {
      // Customer doesn't exist, create new one
      const { data: customerData, error: customerError } = await this.supabase
          .from('customers')
          .insert({
              full_name: bookingData.customer.fullName,
              id_number: bookingData.customer.idNumber,
              phone_number: bookingData.customer.phoneNumber,
              email: bookingData.customer.email
          })
          .select('id')
          .single();

      if (customerError) {
          console.error('Error creating customer:', customerError);
          return null;
      }
      customerId = customerData!.id;
    }


    const newBookingData = {
        customer_id: customerId,
        check_in_date: bookingData.checkInDate,
        check_out_date: bookingData.checkOutDate,
        adults: bookingData.adults,
        children: bookingData.children,
        notes: bookingData.notes,
        total_amount: bookingData.totalAmount,
        deposit_paid: bookingData.depositPaid,
        status: 'ממתין לאישור לקוח',
    };

    const { data: bookingResult, error: bookingError }: PostgrestSingleResponse<any> = await this.supabase
        .from('bookings')
        .insert(newBookingData)
        .select('*, customer:customers(*)')
        .single();

    if (bookingError) {
        console.error('Error adding booking:', bookingError);
        return null;
    }

    if (bookingResult) {
        const newBooking = this.mapBooking(bookingResult);
        this.bookings.update(bookings => [newBooking, ...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return newBooking;
    }
    return null;
  }
  
  async findCustomer(idNumber: string, phoneNumber: string): Promise<Customer | null> {
      if (!this.supabase) return null;
      const { data, error } = await this.supabase
          .from('customers')
          .select('*')
          .or(`id_number.eq.${idNumber},phone_number.eq.${phoneNumber}`)
          .limit(1);

      if (error) {
          console.error('Error finding customer', error);
          return null;
      }
      
      if (data && data.length > 0) {
        const customer = data[0];
        return {
          id: customer.id,
          fullName: customer.full_name,
          idNumber: customer.id_number,
          phoneNumber: customer.phone_number,
          email: customer.email,
        };
      }
      return null;
  }

  async confirmBooking(id: string, signature: string): Promise<boolean> {
    if (!this.supabase) return false;
    const { data, error } = await this.supabase
        .from('bookings')
        .update({ status: 'הזמנה מאושרת', signature: signature })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error confirming booking:', error);
        return false;
    }

    const updatedBooking = this.mapBooking(data);
    this.bookings.update(bookings => {
        const index = bookings.findIndex(b => b.id === id);
        if (index > -1) {
            const updatedBookings = [...bookings];
            updatedBookings[index] = updatedBooking;
            return updatedBookings;
        }
        return bookings;
    });

    return true;
  }
}
