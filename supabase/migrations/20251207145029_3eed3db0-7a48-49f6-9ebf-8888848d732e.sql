-- Create table for storing parental control settings
CREATE TABLE public.parental_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  blocked_topics TEXT[] DEFAULT '{}',
  blocked_words TEXT[] DEFAULT '{}',
  max_response_length INTEGER DEFAULT 1000,
  safe_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parental_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for settings (no auth required for child app)
CREATE POLICY "Anyone can read settings" ON public.parental_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update settings" ON public.parental_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert settings" ON public.parental_settings FOR INSERT WITH CHECK (true);

-- Allow public access to chat messages
CREATE POLICY "Anyone can read messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Insert default settings
INSERT INTO public.parental_settings (password_hash, blocked_topics, blocked_words, safe_mode)
VALUES ('1234', '{}', '{}', true);