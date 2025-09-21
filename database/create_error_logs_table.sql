-- יצירת טבלת error_logs ב-Supabase
-- הפעל את הקוד הזה ב-SQL Editor של Supabase

CREATE TABLE IF NOT EXISTS public.error_logs (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    stack TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת אינדקס לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);

-- הוספת Row Level Security (RLS)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- יצירת policy שמאפשר לכל האפליקציה לכתוב ולקרוא
CREATE POLICY IF NOT EXISTS "Enable all access for error logs" 
ON public.error_logs FOR ALL 
USING (true) 
WITH CHECK (true);

-- הוספת הערה לטבלה
COMMENT ON TABLE public.error_logs IS 'טבלה לשמירת שגיאות של האפליקציה';