-- =======================================================================
-- QUINTANA RUIZ — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =======================================================================

-- ----- 1) Tabla SETTINGS (singleton, una sola fila editable) -----
CREATE TABLE IF NOT EXISTS public.qr_settings (
  id INT PRIMARY KEY DEFAULT 1,
  whatsapp_number TEXT NOT NULL DEFAULT '5493517454262',
  whatsapp_display TEXT NOT NULL DEFAULT '351 745-4262',
  discount_percent INT NOT NULL DEFAULT 25,
  contact_email TEXT NOT NULL DEFAULT 'quintanaruizasesores@gmail.com',
  promo_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

-- Insertar fila por defecto (solo si no existe)
INSERT INTO public.qr_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ----- 2) Tabla POSTS (blog) -----
CREATE TABLE IF NOT EXISTS public.qr_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  category TEXT DEFAULT 'General',
  cover_image TEXT,
  content_html TEXT NOT NULL,
  read_minutes INT DEFAULT 5,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qr_posts_published_idx ON public.qr_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS qr_posts_slug_idx ON public.qr_posts(slug);

-- ----- 3) Tabla SUBMISSIONS (logs de formularios) -----
CREATE TABLE IF NOT EXISTS public.qr_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL,
  data JSONB NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qr_submissions_created_idx ON public.qr_submissions(created_at DESC);

-- ----- 4) Trigger para auto-actualizar updated_at en posts -----
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qr_posts_updated_at ON public.qr_posts;
CREATE TRIGGER qr_posts_updated_at BEFORE UPDATE ON public.qr_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS qr_settings_updated_at ON public.qr_settings;
CREATE TRIGGER qr_settings_updated_at BEFORE UPDATE ON public.qr_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =======================================================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================================================

ALTER TABLE public.qr_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_submissions ENABLE ROW LEVEL SECURITY;

-- SETTINGS: lectura pública, escritura solo autenticados
DROP POLICY IF EXISTS qr_settings_read_public ON public.qr_settings;
CREATE POLICY qr_settings_read_public ON public.qr_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS qr_settings_update_auth ON public.qr_settings;
CREATE POLICY qr_settings_update_auth ON public.qr_settings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- POSTS: lectura pública solo de publicados, lectura completa solo autenticados,
--        escritura solo autenticados
DROP POLICY IF EXISTS qr_posts_read_published ON public.qr_posts;
CREATE POLICY qr_posts_read_published ON public.qr_posts
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS qr_posts_read_auth_all ON public.qr_posts;
CREATE POLICY qr_posts_read_auth_all ON public.qr_posts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS qr_posts_write_auth ON public.qr_posts;
CREATE POLICY qr_posts_write_auth ON public.qr_posts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SUBMISSIONS: cualquiera puede insertar (formularios públicos),
--              solo autenticados leen / actualizan / borran
DROP POLICY IF EXISTS qr_submissions_insert_anon ON public.qr_submissions;
CREATE POLICY qr_submissions_insert_anon ON public.qr_submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS qr_submissions_read_auth ON public.qr_submissions;
CREATE POLICY qr_submissions_read_auth ON public.qr_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS qr_submissions_update_auth ON public.qr_submissions;
CREATE POLICY qr_submissions_update_auth ON public.qr_submissions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =======================================================================
-- STORAGE BUCKET (para imágenes del blog)
-- Después de ejecutar este SQL, crear manualmente el bucket en:
-- Dashboard → Storage → New bucket
--   Name: blog-images
--   Public bucket: ON
-- =======================================================================
