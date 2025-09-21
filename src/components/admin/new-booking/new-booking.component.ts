

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../services/booking.service';
import { Booking, Customer } from '../../../models/booking.model';

@Component({
  selector: 'app-new-booking',
  // Fix: standalone: true is the default in Angular v20+ and should be removed.
  imports: [FormsModule, CommonModule],
  templateUrl: './new-booking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewBookingComponent {
  private bookingService = inject(BookingService);
  router = inject(Router);

  model: any = {
    customer: {},
    booking: {
      adults: 2,
      children: 0,
      depositPaid: 0
    }
  };
  
  isReturningCustomer = signal(false);
  showSuccessModal = signal(false);
  newBookingLink = signal('');

  async checkCustomer() {
      const idNumber = this.model.customer.idNumber;
      const phoneNumber = this.model.customer.phoneNumber;
      if(idNumber || phoneNumber) {
          const existingCustomer = await this.bookingService.findCustomer(idNumber, phoneNumber);
          if(existingCustomer) {
              this.model.customer = {...existingCustomer};
              this.isReturningCustomer.set(true);
          } else {
              this.isReturningCustomer.set(false);
          }
      }
  }

  async onSubmit(form: NgForm) {
    if (form.invalid) {
      return;
    }
    
    // This is just a temporary object for the service, the actual customer ID will be handled by the service.
    const customer: Omit<Customer, 'id'> = {
        fullName: this.model.customer.fullName,
        idNumber: this.model.customer.idNumber,
        phoneNumber: this.model.customer.phoneNumber,
        email: this.model.customer.email
    };
    
    const bookingData: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customer'> & { customer: Omit<Customer, 'id'> } = {
        customer: customer,
        checkInDate: this.model.booking.checkInDate,
        checkOutDate: this.model.booking.checkOutDate,
        adults: this.model.booking.adults,
        children: this.model.booking.children,
        notes: this.model.booking.notes,
        totalAmount: this.model.booking.totalAmount,
        depositPaid: this.model.booking.depositPaid
    };
    
    const newBooking = await this.bookingService.addBooking(bookingData);
    
    if (newBooking) {
      const baseUrl = window.location.origin + window.location.pathname;
      this.newBookingLink.set(`${baseUrl}#/sign/${newBooking.id}`);
      this.showSuccessModal.set(true);
    } else {
      alert('יצירת ההזמנה נכשלה. אנא בדוק את המסוף לקבלת פרטים.');
    }
  }

  copyLink() {
    navigator.clipboard.writeText(this.newBookingLink()).then(() => alert('הקישור הועתק!'));
  }
  
  closeModalAndRedirect() {
      this.showSuccessModal.set(false);
      this.router.navigate(['/admin/dashboard']);
  }
}
