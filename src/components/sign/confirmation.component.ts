

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-confirmation',
  // Fix: standalone: true is the default in Angular v20+ and should be removed.
  imports: [CommonModule, DatePipe],
  templateUrl: './confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationComponent {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);

  bookingId = signal('');
  booking = signal<Booking | undefined | null>(undefined);

  constructor() {
    this.bookingId.set(this.route.snapshot.paramMap.get('id') || '');
    this.loadBooking();
  }

  private async loadBooking() {
    const id = this.bookingId();
    if (id) {
      this.booking.set(await this.bookingService.getBookingById(id));
    } else {
      this.booking.set(null);
    }
  }
}
