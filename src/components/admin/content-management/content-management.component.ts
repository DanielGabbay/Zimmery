import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../../services/content.service';
import { ContentTemplate, CreateContentTemplateRequest, UpdateContentTemplateRequest } from '../../../models/content-template.model';

@Component({
  selector: 'app-content-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './content-management.component.html',
  styleUrls: ['./content-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentManagementComponent {
  private contentService = inject(ContentService);

  templates = this.contentService.getAllTemplates();
  
  // Form state
  showCreateForm = signal(false);
  editingTemplate = signal<ContentTemplate | null>(null);
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Form data
  newTemplate = signal<CreateContentTemplateRequest>({
    template_type: 'welcome_message',
    title: '',
    content: '',
    content_type: 'text',
    html_url: '',
    html_content: '',
    is_active: true
  });

  editForm = signal<UpdateContentTemplateRequest>({
    title: '',
    content: '',
    content_type: 'text',
    html_url: '',
    html_content: '',
    is_active: true
  });

  // Template type options
  templateTypeOptions = [
    { value: 'agreement_terms', label: 'תנאי הסכם אירוח' },
    { value: 'welcome_message', label: 'הודעת ברוכים הבאים' },
    { value: 'confirmation_message', label: 'הודעת אישור' },
    { value: 'pdf_title', label: 'כותרת PDF' },
    { value: 'pdf_header', label: 'כותרת עליונה בPDF' }
  ];

  // Content type options
  contentTypeOptions = [
    { value: 'text', label: 'טקסט פשוט' },
    { value: 'html_url', label: 'קישור לקובץ HTML' },
    { value: 'html_content', label: 'תוכן HTML מוטמע' }
  ];

  constructor() {}

  // Show create form
  showCreate() {
    this.showCreateForm.set(true);
    this.editingTemplate.set(null);
    this.newTemplate.set({
      template_type: 'welcome_message',
      title: '',
      content: '',
      content_type: 'text',
      html_url: '',
      html_content: '',
      is_active: true
    });
    this.clearMessages();
  }

  // Show edit form
  editTemplate(template: ContentTemplate) {
    this.editingTemplate.set(template);
    this.showCreateForm.set(false);
    this.editForm.set({
      title: template.title,
      content: template.content,
      content_type: template.content_type || 'text',
      html_url: template.html_url || '',
      html_content: template.html_content || '',
      is_active: template.is_active
    });
    this.clearMessages();
  }

  // Cancel editing
  cancelEdit() {
    this.showCreateForm.set(false);
    this.editingTemplate.set(null);
    this.clearMessages();
  }

  // Create new template
  async createTemplate() {
    if (!this.newTemplate().title || !this.newTemplate().content) {
      this.errorMessage.set('אנא מלא את כל השדות הנדרשים');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const result = await this.contentService.createTemplate(this.newTemplate());
    
    this.isLoading.set(false);

    if (result) {
      this.successMessage.set('התבנית נוצרה בהצלחה');
      this.cancelEdit();
    } else {
      this.errorMessage.set('אירעה שגיאה ביצירת התבנית');
    }
  }

  // Update existing template
  async updateTemplate() {
    const template = this.editingTemplate();
    if (!template) return;

    if (!this.editForm().title || !this.editForm().content) {
      this.errorMessage.set('אנא מלא את כל השדות הנדרשים');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const success = await this.contentService.updateTemplate(template.id, this.editForm());
    
    this.isLoading.set(false);

    if (success) {
      this.successMessage.set('התבנית עודכנה בהצלחה');
      this.cancelEdit();
    } else {
      this.errorMessage.set('אירעה שגיאה בעדכון התבנית');
    }
  }

  // Delete template
  async deleteTemplate(template: ContentTemplate) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את התבנית "${template.title}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const success = await this.contentService.deleteTemplate(template.id);
    
    this.isLoading.set(false);

    if (success) {
      this.successMessage.set('התבנית נמחקה בהצלחה');
    } else {
      this.errorMessage.set('אירעה שגיאה במחיקת התבנית');
    }
  }

  // Toggle template active status
  async toggleActive(template: ContentTemplate) {
    this.isLoading.set(true);
    this.clearMessages();

    const success = await this.contentService.toggleTemplateActive(template.id);
    
    this.isLoading.set(false);

    if (success) {
      const status = template.is_active ? 'הופסקה' : 'הופעלה';
      this.successMessage.set(`התבנית ${status} בהצלחה`);
    } else {
      this.errorMessage.set('אירעה שגיאה בשינוי סטטוס התבנית');
    }
  }

  // Update new template field
  updateNewTemplate<K extends keyof CreateContentTemplateRequest>(field: K, value: CreateContentTemplateRequest[K]) {
    this.newTemplate.update(template => ({ ...template, [field]: value }));
  }

  // Update edit form field
  updateEditForm<K extends keyof UpdateContentTemplateRequest>(field: K, value: UpdateContentTemplateRequest[K]) {
    this.editForm.update(form => ({ ...form, [field]: value }));
  }

  // Clear messages
  private clearMessages() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  // Get template type label
  getTemplateTypeLabel(type: ContentTemplate['template_type']): string {
    return this.templateTypeOptions.find(opt => opt.value === type)?.label || type;
  }

  // Get content preview (truncated)
  getContentPreview(content: string): string {
    if (content.length <= 100) return content;
    return content.substring(0, 100) + '...';
  }

  // Check if content is JSON array
  isJsonArray(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  // Get formatted JSON array for display
  getFormattedArrayContent(content: string): string[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('he-IL');
  }

  // Event handlers for form inputs
  onNewTemplateTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateNewTemplate('template_type', target.value as any);
  }

  onNewTemplateTitleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateNewTemplate('title', target.value);
  }

  onNewTemplateContentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateNewTemplate('content', target.value);
  }

  onNewTemplateActiveChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateNewTemplate('is_active', target.checked);
  }

  onEditFormTitleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateEditForm('title', target.value);
  }

  onEditFormContentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateEditForm('content', target.value);
  }

  onEditFormActiveChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateEditForm('is_active', target.checked);
  }

  // New event handlers for content type and HTML fields
  onNewTemplateContentTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateNewTemplate('content_type', target.value as any);
  }

  onNewTemplateHtmlUrlInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateNewTemplate('html_url', target.value);
  }

  onNewTemplateHtmlContentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateNewTemplate('html_content', target.value);
  }

  onEditFormContentTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateEditForm('content_type', target.value as any);
  }

  onEditFormHtmlUrlInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateEditForm('html_url', target.value);
  }

  onEditFormHtmlContentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateEditForm('html_content', target.value);
  }
}
