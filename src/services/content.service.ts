import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from './supabase.service';
import { ContentTemplate, CreateContentTemplateRequest, UpdateContentTemplateRequest, DEFAULT_CONTENT_TEMPLATES } from '../models/content-template.model';
import { firstValueFrom } from 'rxjs';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private supabaseService = inject(SupabaseService);
  private http = inject(HttpClient);
  private supabase = this.supabaseService.getClient();

  // Signal to hold all content templates
  private allTemplates = signal<ContentTemplate[]>([]);
  
  // Cache for loaded HTML content
  private htmlCache = new Map<string, string>();

  constructor() {
    this.loadAllTemplates();
  }

  // Get readonly signal for templates
  getAllTemplates() {
    return this.allTemplates.asReadonly();
  }

  // Get template by type
  getTemplateByType(type: ContentTemplate['template_type']): ContentTemplate | undefined {
    return this.allTemplates().find(template => template.template_type === type && template.is_active);
  }

  // Get template content by type (handles HTML templates) - ALWAYS returns HTML
  async getTemplateContent(type: ContentTemplate['template_type']): Promise<string> {
    const template = this.getTemplateByType(type);
    if (!template) {
      // Fallback to default assets if no template found
      return await this.loadFallbackHtml(type);
    }
    
    // Handle different content types - all return HTML
    switch (template.content_type) {
      case 'html_url':
        const urlContent = await this.loadHtmlFromUrl(template.html_url || '');
        return urlContent || await this.loadFallbackHtml(type);
      
      case 'html_content':
        const htmlContent = await this.loadHtmlFromAssets(template.html_content || '');
        return htmlContent || await this.loadFallbackHtml(type);
      
      case 'text':
      default:
        // Convert text to simple HTML
        const textContent = template.content || '';
        return `<div class="text-content">${textContent}</div>`;
    }
  }

  // Load all templates from database
  async loadAllTemplates(): Promise<void> {
    if (!this.supabase) {
      console.warn('Supabase not configured, using default templates');
      this.setDefaultsAsLocal();
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('content_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading content templates:', error);
        // If table doesn't exist or is empty, initialize with defaults
        await this.initializeDefaultTemplates();
        return;
      }

      if (data && data.length > 0) {
        this.allTemplates.set(data);
      } else {
        // If no templates exist, create defaults
        await this.initializeDefaultTemplates();
      }
    } catch (error) {
      console.error('Error in loadAllTemplates:', error);
      // Use defaults in case of any error
      this.setDefaultsAsLocal();
    }
  }

  // Initialize default templates in the database
  private async initializeDefaultTemplates(): Promise<void> {
    if (!this.supabase) {
      this.setDefaultsAsLocal();
      return;
    }

    try {
      console.log('Initializing default content templates...');
      
      const templatesToCreate = DEFAULT_CONTENT_TEMPLATES.map(template => ({
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('content_templates')
        .insert(templatesToCreate)
        .select();

      if (error) {
        console.error('Error creating default templates:', error);
        this.setDefaultsAsLocal();
        return;
      }

      if (data) {
        this.allTemplates.set(data);
        console.log('Default content templates created successfully');
      }
    } catch (error) {
      console.error('Error in initializeDefaultTemplates:', error);
      this.setDefaultsAsLocal();
    }
  }

  // Set defaults as local (fallback when database is not available)
  private setDefaultsAsLocal(): void {
    const templatesWithIds: ContentTemplate[] = DEFAULT_CONTENT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `local-${index}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    this.allTemplates.set(templatesWithIds);
  }

  // Create new template
  async createTemplate(template: CreateContentTemplateRequest): Promise<ContentTemplate | null> {
    if (!this.supabase) {
      console.warn('Supabase not configured, cannot create template');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('content_templates')
        .insert([{
          ...template,
          is_active: template.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return null;
      }

      if (data) {
        // Add to local state
        this.allTemplates.update(templates => [...templates, data]);
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      return null;
    }
  }

  // Update template
  async updateTemplate(id: string, updates: UpdateContentTemplateRequest): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not configured, cannot update template');
      return false;
    }

    try {
      const { data, error } = await this.supabase
        .from('content_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        return false;
      }

      if (data) {
        // Update local state
        this.allTemplates.update(templates =>
          templates.map(template =>
            template.id === id ? data : template
          )
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      return false;
    }
  }

  // Delete template
  async deleteTemplate(id: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not configured, cannot delete template');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('content_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        return false;
      }

      // Update local state
      this.allTemplates.update(templates =>
        templates.filter(template => template.id !== id)
      );

      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return false;
    }
  }

  // Toggle template active status
  async toggleTemplateActive(id: string): Promise<boolean> {
    const template = this.allTemplates().find(t => t.id === id);
    if (!template) return false;

    return await this.updateTemplate(id, { is_active: !template.is_active });
  }

  // Get formatted agreement terms for display
  async getFormattedAgreementTerms(): Promise<string[]> {
    const content = await this.getTemplateContent('agreement_terms');
    if (Array.isArray(content)) {
      return content.map((term, index) => `${index + 1}. ${term}`);
    }
    return [content as string];
  }

  // Load HTML from external URL
  private async loadHtmlFromUrl(url: string): Promise<string> {
    if (!url) return '';
    
    // Check cache first
    if (this.htmlCache.has(url)) {
      return this.htmlCache.get(url)!;
    }
    
    try {
      const html = await firstValueFrom(this.http.get(url, { responseType: 'text' }));
      this.htmlCache.set(url, html);
      return html;
    } catch (error) {
      console.error('Error loading HTML from URL:', url, error);
      // Return fallback to local assets
      const fallbackPath = this.getFallbackPath(url);
      if (fallbackPath) {
        return await this.loadHtmlFromAssets(fallbackPath);
      }
      return '';
    }
  }

  // Load HTML from assets folder
  private async loadHtmlFromAssets(assetPath: string): Promise<string> {
    if (!assetPath) return '';
    
    // Check cache first
    if (this.htmlCache.has(assetPath)) {
      return this.htmlCache.get(assetPath)!;
    }
    
    try {
      const html = await firstValueFrom(this.http.get(assetPath, { responseType: 'text' }));
      this.htmlCache.set(assetPath, html);
      return html;
    } catch (error) {
      console.error('Error loading HTML from assets:', assetPath, error);
      return '';
    }
  }

  // Get processed HTML with data substitution
  async getProcessedHtml(type: ContentTemplate['template_type'], data: any = {}): Promise<string> {
    const htmlContent = await this.getTemplateContent(type) as string;
    if (!htmlContent || Array.isArray(htmlContent)) {
      return '';
    }
    
    return this.substituteTemplateVariables(htmlContent, data);
  }

  // Substitute template variables in HTML
  private substituteTemplateVariables(html: string, data: any): string {
    let processedHtml = html;
    
    // Replace {{variable}} placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedHtml = processedHtml.replace(regex, data[key] || '');
    });
    
    // Handle special cases
    processedHtml = processedHtml.replace(/{{currentDate}}/g, new Date().toLocaleDateString('he-IL'));
    processedHtml = processedHtml.replace(/{{websiteUrl}}/g, window.location.origin);
    processedHtml = processedHtml.replace(/{{pageNumber}}/g, '1');
    processedHtml = processedHtml.replace(/{{totalPages}}/g, '1');
    
    return processedHtml;
  }

  // Get fallback path for external URLs
  private getFallbackPath(url: string): string | null {
    if (url.includes('agreement')) return 'assets/templates/agreement-template.html';
    if (url.includes('welcome')) return 'assets/templates/welcome-message.html';
    if (url.includes('confirmation')) return 'assets/templates/confirmation-message.html';
    return null;
  }

  // Load fallback HTML from assets based on template type
  private async loadFallbackHtml(type: ContentTemplate['template_type']): Promise<string> {
    const fallbackPaths = {
      'agreement_terms': 'assets/templates/agreement-template.html',
      'welcome_message': 'assets/templates/welcome-message.html',
      'confirmation_message': 'assets/templates/confirmation-message.html',
      'pdf_title': 'assets/templates/pdf-title.html',
      'pdf_header': 'assets/templates/pdf-header.html'
    };
    
    const fallbackPath = fallbackPaths[type];
    if (fallbackPath) {
      try {
        return await this.loadHtmlFromAssets(fallbackPath);
      } catch (error) {
        console.warn(`Failed to load fallback HTML for ${type}:`, error);
      }
    }
    
    // Final fallback - return default HTML based on type
    switch (type) {
      case 'agreement_terms':
        return `<div class="fallback-agreement">
          <h3>הסכם אירוח</h3>
          <ol>
            <li>האירוח הינו אישי ואינו ניתן להעברה.</li>
            <li>ביטולים יתקבלו עד 14 יום לפני מועד האירוח.</li>
            <li>יש לשמור על השקט והניקיון במתחם.</li>
          </ol>
        </div>`;
      case 'welcome_message':
        return `<div class="fallback-welcome">שלום וברוכים הבאים!</div>`;
      case 'confirmation_message':
        return `<div class="fallback-confirmation">תודה! ההסכם נחתם בהצלחה.</div>`;
      case 'pdf_title':
        return `<div class="fallback-title">אישור הסכם אירוח</div>`;
      case 'pdf_header':
        return `<div class="fallback-header">הסכם אירוח</div>`;
      default:
        return `<div class="fallback-default">תוכן לא זמין</div>`;
    }
  }

  // Generate HTML for PDF (specific method for agreement)
  async getAgreementHtmlForPdf(booking: Booking, signatureDataUrl: string): Promise<string> {
    const data = {
      customerName: booking.customer.fullName,
      customerId: booking.customer.idNumber,
      customerPhone: booking.customer.phoneNumber,
      bookingId: booking.id,
      checkinDate: new Date(booking.checkInDate).toLocaleDateString('he-IL'),
      checkoutDate: new Date(booking.checkOutDate).toLocaleDateString('he-IL'),
      signatureImage: signatureDataUrl
    };
    
    return await this.getProcessedHtml('agreement_terms', data);
  }
}
