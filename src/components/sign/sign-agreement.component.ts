

import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, ViewChild, afterNextRender } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { ThemeService } from '../../services/theme.service';
import { ContentService } from '../../services/content.service';
import { Booking } from '../../models/booking.model';
import SignaturePad from 'signature_pad';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  contentService = inject(ContentService);

  bookingId = signal('');
  booking = signal<Booking | undefined | null>(undefined); // undefined: loading, null: not found

  isAuthenticated = signal(false);
  idNumberInput = signal('');
  errorMessage = signal<string | null>(null);
  
  termsAccepted = signal(false);
  isLoading = signal(false);
  agreementTerms = signal<string[]>([]);
  welcomeMessage = signal<string>('');
  pdfHeaderText = signal<string>('');
  
  @ViewChild('signaturePadCanvas') signaturePadCanvas!: ElementRef<HTMLCanvasElement>;
  private signaturePad: SignaturePad | undefined;


  constructor() {
    this.bookingId.set(this.route.snapshot.paramMap.get('id') || '');
    this.loadBooking();
    this.loadContentData();
    
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

  private async loadContentData() {
    try {
      // Load agreement terms
      const terms = await this.contentService.getFormattedAgreementTerms();
      this.agreementTerms.set(terms);
      
      // Set welcome message
      this.welcomeMessage.set('ברוכים הבאים! אנו שמחים לארח אתכם.');
      
      // Set PDF header
      this.pdfHeaderText.set('הסכם אירוח');
      
    } catch (error) {
      console.error('Error loading content data:', error);
      // Set fallback content
      this.agreementTerms.set([
        '1. האירוח הינו אישי ואינו ניתן להעברה.',
        '2. ביטולים יתקבלו עד 14 יום לפני מועד האירוח.',
        '3. יש לשמור על השקט והניקיון במתחם.',
        '4. הלקוח מתחייב לשלם את התשלום המלא במועד שנקבע.',
        '5. כל נזק שיגרם למתחם יחויב על הלקוח.'
      ]);
      this.welcomeMessage.set('ברוכים הבאים!');
      this.pdfHeaderText.set('הסכם אירוח');
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

  async generatePdf(signatureDataUrl: string) {
    const currentBooking = this.booking();
    if (!currentBooking) return;

    try {
      // Use the new HTML template system
      const htmlContent = await this.contentService.getAgreementHtmlForPdf(currentBooking, signatureDataUrl);
      
      if (htmlContent) {
        // Create a new window with the beautiful HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Wait for content and fonts to load, then print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
              
              this.isLoading.set(false);
              this.router.navigate(['/confirmation', currentBooking.id]);
            }, 1000); // Increased timeout for font loading
          };
        } else {
          // Fallback to simple PDF if popup is blocked
          await this.generateSimplePdf(signatureDataUrl, currentBooking);
        }
      } else {
        // Fallback to simple PDF if HTML template fails
        await this.generateSimplePdf(signatureDataUrl, currentBooking);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.errorMessage.set('אירעה שגיאה ביצירת הקובץ. אנא נסה שוב.');
      this.isLoading.set(false);
    }
  }

  private async generateSimplePdf(signatureDataUrl: string, currentBooking: Booking) {
    try {
      const doc = new jsPDF();
      
      // Configure for RTL Hebrew text
      doc.setR2L(true);
      
      // Add header with current date
      const currentDate = new Date().toLocaleDateString('he-IL');
      doc.setFontSize(10);
      doc.text(currentDate, 200, 15, { align: 'right' });
      doc.text('about:blank', 15, 15);
      
      // Add main title - use dynamic content
      const pdfTitle = await this.contentService.getTemplateContent('pdf_title') as string || 'אישור הסכם אירוח';
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(pdfTitle, 105, 35, { align: 'center' });
      
      // Add a line under title
      doc.setLineWidth(0.5);
      doc.line(40, 42, 170, 42);
      
      // Customer and booking details section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      const checkin = new Date(currentBooking.checkInDate).toLocaleDateString('he-IL');
      const checkout = new Date(currentBooking.checkOutDate).toLocaleDateString('he-IL');
      
      // Right-aligned details
      doc.text(`מספר הזמנה: ${currentBooking.id}`, 190, 60, { align: 'right' });
      doc.text(`שם הלקוח: ${currentBooking.customer.fullName}`, 190, 70, { align: 'right' });
      doc.text(`ת.ז.: ${currentBooking.customer.idNumber}`, 190, 80, { align: 'right' });
      doc.text(`תאריכים: ${checkin} - ${checkout}`, 190, 90, { align: 'right' });
      
      // Agreement section title - use dynamic content
      const agreementHeader = await this.contentService.getTemplateContent('pdf_header') as string || 'הסכם אירוח';
      doc.setFont('helvetica', 'bold');
      doc.text(agreementHeader, 190, 115, { align: 'right' });
      
      // Agreement terms - use dynamic content
      doc.setFont('helvetica', 'normal');
      const dynamicTerms = await this.contentService.getFormattedAgreementTerms();
      const agreementText = dynamicTerms.length > 0 ? dynamicTerms : [
        '1. האירוח הינו אישי ואינו ניתן להעברה.',
        '2. ביטולים יתקבלו עד 14 יום לפני מועד האירוח.',
        '3. יש לשמור על השקט והניקיון במתחם.',
        '4. הלקוח מתחייב לשלם את התשלום המלא במועד שנקבע.',
        '5. כל נזק שיגרם למתחם יחויב על הלקוח.'
      ];
      
      let yPosition = 130;
      agreementText.forEach(line => {
        doc.text(line, 190, yPosition, { align: 'right' });
        yPosition += 12;
      });
      
      // Add signature section
      doc.setFont('helvetica', 'bold');
      doc.text('חתימת הלקוח:', 105, 200, { align: 'center' });
      
      // Add a border for signature area
      doc.setLineWidth(1);
      doc.rect(45, 210, 120, 40);
      
      if (signatureDataUrl && signatureDataUrl.startsWith('data:image')) {
        try {
          // Center the signature in the box
          doc.addImage(signatureDataUrl, 'PNG', 65, 220, 80, 20);
        } catch (imageError) {
          console.warn('Could not add signature image:', imageError);
          doc.setFont('helvetica', 'normal');
          doc.text('חתימה לא זמינה', 105, 235, { align: 'center' });
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('חתימה לא זמינה', 105, 235, { align: 'center' });
      }
      
      // Add footer
      doc.setFontSize(8);
      doc.text('about:blank', 15, 285);
      doc.text('1/1', 195, 285, { align: 'right' });
      
      // Add document border
      doc.setLineWidth(2);
      doc.rect(10, 10, 190, 277);

      // Save and navigate
      doc.save(`agreement-${currentBooking.id}.pdf`);
      
      this.isLoading.set(false);
      this.router.navigate(['/confirmation', currentBooking.id]);
      
    } catch (error) {
      console.error('Error generating simple PDF:', error);
      this.errorMessage.set('אירעה שגיאה ביצירת הקובץ. אנא נסה שוב.');
      this.isLoading.set(false);
    }
  }
}
