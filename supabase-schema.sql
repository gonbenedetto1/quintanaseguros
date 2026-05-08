-- =======================================================================
-- QUINTANA RUIZ — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =======================================================================

-- ----- 1) Tabla SETTINGS (singleton, una sola fila editable) -----
CREATE TABLE IF NOT EXISTS public.settings (
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
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ----- 2) Tabla POSTS (blog) -----
CREATE TABLE IF NOT EXISTS public.posts (
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

CREATE INDEX IF NOT EXISTS posts_published_idx ON public.posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts(slug);

-- ----- 3) Tabla SUBMISSIONS (logs de formularios) -----
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL,
  data JSONB NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_created_idx ON public.submissions(created_at DESC);

-- ----- 4) Trigger para auto-actualizar updated_at en posts -----
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON public.settings;
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =======================================================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================================================

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- SETTINGS: lectura pública, escritura solo autenticados
DROP POLICY IF EXISTS settings_read_public ON public.settings;
CREATE POLICY settings_read_public ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS settings_update_auth ON public.settings;
CREATE POLICY settings_update_auth ON public.settings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- POSTS: lectura pública solo de publicados, lectura completa solo autenticados,
--        escritura solo autenticados
DROP POLICY IF EXISTS posts_read_published ON public.posts;
CREATE POLICY posts_read_published ON public.posts
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS posts_read_auth_all ON public.posts;
CREATE POLICY posts_read_auth_all ON public.posts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS posts_write_auth ON public.posts;
CREATE POLICY posts_write_auth ON public.posts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SUBMISSIONS: cualquiera puede insertar (formularios públicos),
--              solo autenticados leen / actualizan / borran
DROP POLICY IF EXISTS submissions_insert_anon ON public.submissions;
CREATE POLICY submissions_insert_anon ON public.submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS submissions_read_auth ON public.submissions;
CREATE POLICY submissions_read_auth ON public.submissions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS submissions_update_auth ON public.submissions;
CREATE POLICY submissions_update_auth ON public.submissions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =======================================================================
-- STORAGE BUCKET (para imágenes del blog)
-- Después de ejecutar este SQL, crear manualmente el bucket en:
-- Dashboard → Storage → New bucket
--   Name: blog-images
--   Public bucket: ON
-- =======================================================================
