

import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, ViewChild, afterNextRender } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { ThemeService } from '../../services/theme.service';
import { Booking } from '../../../models/booking.model';
import SignaturePad from 'signature_pad';
import { jsPDF } from 'jspdf';
import { assistantFont } from '../../../assets/assistant-font';

@Component({
  selector: 'app-sign-agreement',
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './sign-agreement.component.html',
  styleUrls: ['./sign-agreement.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignAgreementComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);
  private themeService = inject(ThemeService);

  bookingId = signal('');
  booking = signal<Booking | undefined | null>(undefined); // undefined: loading, null: not found

  isAuthenticated = signal(false);
  idNumberInput = signal('');
  errorMessage = signal<string | null>(null);
  
  termsAccepted = signal(false);
  isLoading = signal(false);
  
  @ViewChild('signaturePadCanvas') signaturePadCanvas!: ElementRef<HTMLCanvasElement>;
  private signaturePad: SignaturePad | undefined;

  constructor() {
    this.bookingId.set(this.route.snapshot.paramMap.get('id') || '');
    this.loadBooking();
    
    afterNextRender(() => {
        if(this.isAuthenticated() && this.signaturePadCanvas) {
            this.initializeSignaturePad();
        }
    });
  }

  private async loadBooking() {
    const id = this.bookingId();
    if (id) {
      this.booking.set(await this.bookingService.getBookingById(id));
    } else {
      this.booking.set(null);
    }
  }

  verifyId() {
    const booking = this.booking();
    if (booking && booking.customer.idNumber === this.idNumberInput()) {
      this.isAuthenticated.set(true);
      this.errorMessage.set(null);
      setTimeout(() => this.initializeSignaturePad(), 0);
    } else {
      this.errorMessage.set('מספר תעודת הזהות אינו תואם להזמנה.');
    }
  }
  
  private initializeSignaturePad() {
    if (this.signaturePadCanvas) {
        const canvas = this.signaturePadCanvas.nativeElement;
        const ratio =  Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        const backgroundColor = this.themeService.theme() === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(255, 255, 255)'; // gray-700 for dark
        
        this.signaturePad = new SignaturePad(canvas, {
          backgroundColor: backgroundColor,
        });
    }
  }

  clearSignature() {
    this.signaturePad?.clear();
  }

  async submitAgreement() {
    if (!this.signaturePad || this.signaturePad.isEmpty()) {
      alert('אנא חתום על ההסכם.');
      return;
    }
    if (!this.termsAccepted()) {
      alert('יש לאשר את תנאי ההסכם.');
      return;
    }

    this.isLoading.set(true);
    
    const signatureDataUrl = this.signaturePad.toDataURL('image/png');
    const success = await this.bookingService.confirmBooking(this.bookingId(), signatureDataUrl);
    
    if (success) {
      this.generatePdf(signatureDataUrl); // Also navigates on completion
    } else {
      this.errorMessage.set('אירעה שגיאה באישור ההזמנה.');
      this.isLoading.set(false);
    }
  }

  generatePdf(signatureDataUrl: string) {
    const currentBooking = this.booking();
    if (!currentBooking) return;

    const doc = new jsPDF();
    
    // 1. Add the font to the virtual file system
    doc.addFileToVFS('Assistant-Regular.ttf', assistantFont);
    
    // 2. Add the font to jsPDF
    doc.addFont('Assistant-Regular.ttf', 'Assistant', 'normal');
    
    // 3. Set the font
    doc.setFont('Assistant');

    doc.setR2L(true);
    
    doc.text('אישור הסכם אירוח', 105, 20, { align: 'center' });
    
    const rightAlignOptions = { align: 'right' as const };
    const rightMargin = 200;

    doc.text(`מספר הזמנה: ${currentBooking.id}`, rightMargin, 30, rightAlignOptions);
    doc.text(`שם הלקוח: ${currentBooking.customer.fullName}`, rightMargin, 40, rightAlignOptions);
    doc.text(`ת.ז.: ${currentBooking.customer.idNumber}`, rightMargin, 50, rightAlignOptions);
    
    const checkin = new Date(currentBooking.checkInDate).toLocaleDateString('he-IL');
    const checkout = new Date(currentBooking.checkOutDate).toLocaleDateString('he-IL');
    doc.text(`תאריכים: ${checkin} - ${checkout}`, rightMargin, 60, rightAlignOptions);

    doc.text('--- הסכם אירוח (טקסט לדוגמה) ---', rightMargin, 80, rightAlignOptions);
    const agreementText = [
        '1. האירוח הינו אישי ואינו ניתן להעברה.',
        '2. ביטולים יתקבלו עד 14 יום לפני מועד האירוח.',
        '3. יש לשמור על השקט והניקיון במתחם.',
        '(טקסט הסכם מלא יופיע כאן...)'
    ];
    doc.text(agreementText, rightMargin, 90, rightAlignOptions);
    
    doc.text('חתימת הלקוח:', rightMargin, 150, rightAlignOptions);
    doc.addImage(signatureDataUrl, 'PNG', rightMargin - 80, 155, 80, 40);

    doc.save(`agreement-${currentBooking.id}.pdf`);
    
    this.isLoading.set(false);
    this.router.navigate(['/confirmation', currentBooking.id]);
  }
}
