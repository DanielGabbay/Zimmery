-- Create content_templates table for dynamic content management

CREATE TABLE public.content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to ensure template_type has valid values
ALTER TABLE public.content_templates 
ADD CONSTRAINT valid_template_types 
CHECK (template_type IN (
    'agreement_terms', 
    'welcome_message', 
    'confirmation_message', 
    'pdf_title', 
    'pdf_header'
));

-- Create index for better query performance
CREATE INDEX idx_content_templates_type_active ON public.content_templates(template_type, is_active);
CREATE INDEX idx_content_templates_created_at ON public.content_templates(created_at DESC);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admins) to manage content
CREATE POLICY "Enable full access for authenticated users" ON public.content_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default content templates
INSERT INTO public.content_templates (template_type, title, content, is_active) VALUES
('agreement_terms', 'תנאי הסכם אירוח', '["האירוח הינו אישי ואינו ניתן להעברה.", "ביטולים יתקבלו עד 14 יום לפני מועד האירוח.", "יש לשמור על השקט והניקיון במתחם.", "הלקוח מתחייב לשלם את התשלום המלא במועד שנקבע.", "כל נזק שיגרם למתחם יחויב על הלקוח."]', true),
('welcome_message', 'הודעת ברוכים הבאים', 'שלום וברוכים הבאים! אנא הזן את מספר תעודת הזהות כדי לאמת את זהותך ולחתום על הסכם האירוח.', true),
('confirmation_message', 'הודעת אישור', 'תודה! ההסכם נחתם בהצלחה. תקבל עותק של ההסכם החתום.', true),
('pdf_title', 'כותרת PDF', 'אישור הסכם אירוח', true),
('pdf_header', 'כותרת עליונה בPDF', 'הסכם אירוח', true);

-- Add comments for documentation
COMMENT ON TABLE public.content_templates IS 'Table for storing dynamic content templates used throughout the application';
COMMENT ON COLUMN public.content_templates.template_type IS 'Type of template: agreement_terms, welcome_message, confirmation_message, pdf_title, pdf_header';
COMMENT ON COLUMN public.content_templates.title IS 'Human-readable title for the template';
COMMENT ON COLUMN public.content_templates.content IS 'Template content - can be plain text or JSON for structured data';
COMMENT ON COLUMN public.content_templates.is_active IS 'Whether this template is currently active and should be used';
COMMENT ON COLUMN public.content_templates.created_at IS 'Timestamp when the template was created';
COMMENT ON COLUMN public.content_templates.updated_at IS 'Timestamp when the template was last updated';