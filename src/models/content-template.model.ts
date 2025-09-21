export interface ContentTemplate {
  id: string;
  template_type: 'agreement_terms' | 'welcome_message' | 'confirmation_message' | 'pdf_title' | 'pdf_header';
  title: string;
  content: string; // For backward compatibility
  content_type: 'text' | 'html_url' | 'html_content';
  html_url?: string; // URL to external HTML file
  html_content?: string; // Inline HTML content
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateContentTemplateRequest {
  template_type: ContentTemplate['template_type'];
  title: string;
  content?: string; // For backward compatibility
  content_type: 'text' | 'html_url' | 'html_content';
  html_url?: string;
  html_content?: string;
  is_active?: boolean;
}

export interface UpdateContentTemplateRequest {
  title?: string;
  content?: string; // For backward compatibility
  content_type?: 'text' | 'html_url' | 'html_content';
  html_url?: string;
  html_content?: string;
  is_active?: boolean;
}

// Default content templates - ALL using HTML files
export const DEFAULT_CONTENT_TEMPLATES: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    template_type: 'agreement_terms',
    title: 'הסכם אירוח מלא',
    content: '', // Backward compatibility
    content_type: 'html_content',
    html_content: 'assets/templates/agreement-template.html',
    is_active: true
  },
  {
    template_type: 'welcome_message',
    title: 'הודעת ברוכים הבאים',
    content: '', // Backward compatibility
    content_type: 'html_content',
    html_content: 'assets/templates/welcome-message.html',
    is_active: true
  },
  {
    template_type: 'confirmation_message',
    title: 'הודעת אישור',
    content: '', // Backward compatibility
    content_type: 'html_content',
    html_content: 'assets/templates/confirmation-message.html',
    is_active: true
  },
  {
    template_type: 'pdf_title',
    title: 'כותרת PDF',
    content: '', // Backward compatibility
    content_type: 'html_content',
    html_content: 'assets/templates/pdf-title.html',
    is_active: true
  },
  {
    template_type: 'pdf_header',
    title: 'כותרת עליונה בPDF',
    content: '', // Backward compatibility
    content_type: 'html_content',
    html_content: 'assets/templates/pdf-header.html',
    is_active: true
  }
];
