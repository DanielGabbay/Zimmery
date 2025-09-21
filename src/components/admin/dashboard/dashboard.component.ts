

import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';

@Component({
  selector: 'app-dashboard',
  // Fix: standalone: true is the default in Angular v20+ and should be removed.
  imports: [RouterLink, CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private bookingService = inject(BookingService);
  
  searchTerm = signal('');
  filterStatus = signal('הכל');

  bookings = this.bookingService.allBookings;

  filteredBookings = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.filterStatus();
    
    return this.bookings()
      .filter(booking => 
        (status === 'הכל' || booking.status === status) &&
        (booking.customer.fullName.toLowerCase().includes(term) ||
         booking.customer.phoneNumber.includes(term) ||
         booking.id.toLowerCase().includes(term))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  
  getShareableLink(bookingId: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/sign/${bookingId}`;
  }

  copyLink(bookingId: string) {
    const link = this.getShareableLink(bookingId);
    navigator.clipboard.writeText(link).then(() => {
        alert('הקישור הועתק!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  }

  sendWhatsApp(bookingId: string) {
    const link = this.getShareableLink(bookingId);
    const booking = this.bookings().find(b => b.id === bookingId);
    if(booking) {
        const message = `שלום ${booking.customer.fullName}, לאישור ההזמנה שלכם בצימר, אנא לחצו על הקישור: ${link}`;
        const whatsappUrl = `https://wa.me/${booking.customer.phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'הזמנה מאושרת':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'ממתין לאישור לקוח':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'בוטלה':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'הושלמה':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onFilterChange(event: Event) {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
  }
}