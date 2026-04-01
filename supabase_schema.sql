-- ==========================================
-- MATERNICARE DATABASE SCHEMA
-- Copiez ce code dans l'éditeur SQL de Supabase
-- ==========================================

-- 1. Table des Profils (Extensions de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT DEFAULT 'sage-femme' CHECK (role IN ('sage-femme', 'responsable', 'admin')),
  centre TEXT NOT NULL,
  email TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Table des Enquêtes SFE (Sages-Femmes)
CREATE TABLE IF NOT EXISTS public.surveys_sfe (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  sage_femme TEXT,
  centre TEXT,
  
  -- Section 1 & 2
  age INTEGER,
  experience_pro TEXT,
  formation_hta BOOLEAN,
  annee_formation TEXT,
  def_hta TEXT,
  autre_def_hta TEXT,
  carac_preeclampsie TEXT,
  autre_carac_preeclampsie TEXT,
  age_gestationnel TEXT,
  autre_age_gestationnel TEXT,
  fact_risque TEXT[], -- Array pour les sélections multiples
  autre_fact_risque TEXT,
  signes_cliniques TEXT[],
  autre_signes_cliniques TEXT,
  
  -- Section 3 & 4
  freq_controle_ta TEXT,
  autre_freq_controle_ta TEXT,
  mesure_systematique_ta TEXT,
  recherch_proteinurie TEXT,
  autre_recherch_proteinurie TEXT,
  surveillance_mvt_foetaux BOOLEAN,
  elements_hypertendue TEXT[],
  autre_elements_hypertendue TEXT,
  conduite_hta_grossesse TEXT[],
  autre_conduite_hta TEXT,
  antihypertensifs TEXT[],
  autre_antihypertensifs TEXT,
  cas_reference TEXT,
  conseils_hypertendue TEXT[],
  difficultes_hta BOOLEAN,
  details_difficultes TEXT,
  ameliorations_proposees TEXT,
  collaboration_relais BOOLEAN,
  comment_collaboration TEXT,
  contre_ref_renvoyees BOOLEAN,
  pourquoi_non_contre_ref TEXT,
  proportion_guerison TEXT,
  autre_proportion_guerison TEXT,
  femmes_risque_complications TEXT[],
  
  statut TEXT DEFAULT 'brouillon',
  alerte BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.surveys_sfe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les experts voient leurs propres enquêtes SFE" ON public.surveys_sfe;
CREATE POLICY "Les experts voient leurs propres enquêtes SFE" 
ON public.surveys_sfe FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les experts peuvent insérer leurs enquêtes SFE" ON public.surveys_sfe;
CREATE POLICY "Les experts peuvent insérer leurs enquêtes SFE" 
ON public.surveys_sfe FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les experts peuvent modifier leurs enquêtes SFE" ON public.surveys_sfe;
CREATE POLICY "Les experts peuvent modifier leurs enquêtes SFE" 
ON public.surveys_sfe FOR UPDATE USING (auth.uid() = user_id);

-- 3. Table des Enquêtes Patientes
CREATE TABLE IF NOT EXISTS public.surveys_patientes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  sage_femme TEXT,
  centre TEXT,
  
  nom_patiente TEXT,
  prenom_patiente TEXT,
  telephone_patiente TEXT,
  age TEXT,
  situation_matrimoniale TEXT,
  niveau_instruction TEXT,
  profession TEXT,
  autre_profession TEXT,
  lieu_residence TEXT,
  nb_grossesses TEXT,
  nb_enfants_vivants TEXT,
  faux_couche BOOLEAN,
  atcd_hta_preeclampsie BOOLEAN,
  
  -- Section 3 & 4
  inscrite_cpn BOOLEAN,
  mois_debut_cpn TEXT,
  nb_consultations TEXT,
  suivi TEXT,
  autre_suivi TEXT,
  ta_mesuree TEXT,
  entendu_hta_grossesse BOOLEAN,
  danger_hta_mere_bebe BOOLEAN,
  connaissance_preeclampsie BOOLEAN,
  source_info_preeclampsie TEXT,
  autre_source TEXT,
  signes_alerte TEXT[],
  sf_explique_sgns_danger BOOLEAN,
  lesquels_sgns_danger TEXT,
  conseils_prevention BOOLEAN,
  lesquels_conseils TEXT,
  satisfaction_suivi BOOLEAN,
  suggestions TEXT[],
  autre_suggestions TEXT,
  
  statut TEXT DEFAULT 'brouillon',
  alerte BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Migration pour ajouter les colonnes d'idientité si elles manquent (si table existait déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='surveys_patientes' AND column_name='nom_patiente') THEN
    ALTER TABLE public.surveys_patientes ADD COLUMN nom_patiente TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='surveys_patientes' AND column_name='prenom_patiente') THEN
    ALTER TABLE public.surveys_patientes ADD COLUMN prenom_patiente TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='surveys_patientes' AND column_name='telephone_patiente') THEN
    ALTER TABLE public.surveys_patientes ADD COLUMN telephone_patiente TEXT;
  END IF;
END $$;

ALTER TABLE public.surveys_patientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les experts voient les données de leurs propres patientes" ON public.surveys_patientes;
CREATE POLICY "Les experts voient les données de leurs propres patientes" 
ON public.surveys_patientes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les experts peuvent insérer des données patientes" ON public.surveys_patientes;
CREATE POLICY "Les experts peuvent insérer des données patientes" 
ON public.surveys_patientes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les experts peuvent modifier les données de leurs patientes" ON public.surveys_patientes;
CREATE POLICY "Les experts peuvent modifier les données de leurs patientes" 
ON public.surveys_patientes FOR UPDATE USING (auth.uid() = user_id);

-- 4. Trigger pour la création automatique du profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, role, centre, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nom', 'Utilisateur'), 
    COALESCE(new.raw_user_meta_data->>'prenom', ''), 
    COALESCE(new.raw_user_meta_data->>'role', 'sage-femme'), 
    COALESCE(new.raw_user_meta_data->>'centre', 'Non défini'),
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    centre = EXCLUDED.centre,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
