// ============================================================
// ROUTES
// ============================================================
export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  FORMULAIRE_SFE: '/formulaire/sfe',
  FORMULAIRE_PATIENTE: '/formulaire/patiente',
  FORMULAIRE_PATIENTE_HTA: '/formulaire/patiente-hta',
  STATISTIQUES: '/statistiques',
  HISTORIQUE: '/historique',
};

// ============================================================
// TYPES
// ============================================================
export interface ReponseSFE {
  id: string;
  date: string;
  sageFemme: string;
  centre: string;
  // Section 1 - Données sociodémographiques
  age: number | null;
  experiencePro: string;
  formationHta: boolean;
  anneeFormation: string;
  // Section 2 - Connaissances
  defHta: string;
  autreDefHta: string;
  caracPreeclampsie: string;
  autreCaracPreeclampsie: string;
  ageGestationnel: string;
  autreAgeGestationnel: string;
  factRisque: string[];
  autreFactRisque: string;
  signesCliniques: string[];
  autreSignesCliniques: string;
  // Section 3 - Pratiques
  freqControleTA: string;
  autreFreqControleTA: string;
  mesureSystematiqueTA: string;
  recherchProteinurie: string;
  autreRecherchProteinurie: string;
  surveillanceMvtFoetaux: boolean;
  elementsHypertendue: string[];
  autreElementsHypertendue: string;
  conduiteHtaGrossesse: string[];
  autreConduiteHta: string;
  antihypertensifs: string[];
  autreAntihypertensifs: string;
  casReference: string;
  informeSignesDanger: boolean;
  signesDangerExpliques: string[];
  conseilsHypertendue: string[];
  autreConseilsHypertendue: string;
  difficultesHta: boolean;
  difficultesRencontrees: string[];
  autreDifficultes: string;
  ameliorationsProposees: string;
  collaborationRelais: boolean;
  commentCollaboration: string;
  contreRefRenvoyees: boolean;
  pourquoiNonContreRef: string;
  laboFonctionnel: boolean;
  statut: 'complet' | 'brouillon';
  alerte: boolean;
}

export interface ReponsePatiente {
  id: string;
  date: string;
  sageFemme: string;
  centre: string;
  // Section 1 - Socio-démographiques
  nomPatiente: string;
  prenomPatiente: string;
  telephonePatiente: string;
  age: string;
  situationMatrimoniale: string;
  niveauInstruction: string;
  profession: string;
  autreProfession: string;
  lieuResidence: string;
  // Section 2 - Antécédents
  nbGrossesses: string;
  nbEnfantsVivants: string;
  fauxCouche: boolean;
  atcdHtaPreeclampsie: boolean;
  dejaCesarisee: boolean;
  nbCesariennes: string;
  accoucheApresCesarienne: boolean;
  // Section 3 - Suivi prénatal
  inscriteCpn: boolean;
  moisDebutCpn: string;
  nbConsultations: string;
  suivi: string;
  autreSuivi: string;
  taMesuree: string;
  // Section 4 - Connaissances
  entenduHtaGrossesse: boolean;
  dangerHtaMereBebe: boolean;
  connaissancePreeclampsie: boolean;
  sourceInfoPreeclampsie: string;
  autreSource: string;
  signesAlerte: string[];
  sfExpliqueSgnsDanger: boolean;
  conseilsPrevention: boolean;
  conseilleRevenirRapidement: boolean;
  satisfactionSuivi: boolean;
  suggestions: string[];
  autreSuggestions: string;
  statut: 'complet' | 'brouillon';
  alerte: boolean;
}

export interface ReponsePatienteHTA {
  id: string;
  date: string;
  sageFemme: string;
  centre: string;
  nomPatiente: string;
  prenomPatiente: string;
  telephonePatiente: string;
  q1RoleSf: string;
  q2TensionElevee: string;
  q3RisqueComplication: string;
  q4MesureTa: string;
  q5NoteResultats: string;
  q6RdvRapproches: string;
  q7RevenirRapidement: string;
  q8ExpliqueEtat: string;
  q9BienSuivie: string;
  q10Ecoute: string;
  q11Confiance: string;
  q12EvalueSuivi: string;
  q13RoleSfHta: string;
  q14MesureTaChaqueConsult: string;
  q15ImportanceBandelette: string;
  q16BandeletteDetecteComplication: string;
  q17InsisteBandelette: string;
  q18SaitPourquoiBandelette: string;
  q19PourquoiBandelette: string[];
  q20ComprendExplications: string;
  q21PoseQuestions: string;
  q22TensionEleveeGrossesse: string;
  q23ActionSf: string;
  q24RegulierementSuivie: string;
  q25ExamensDemandes: string;
  q26SignesInhabituels: string[];
  statut: 'complet' | 'brouillon';
  alerte: boolean;
}

export type FormMode = 'patient' | 'registre';
export type FormType = 'sfe' | 'patiente' | 'patiente_hta';

export interface AlertePreeclampsie {
  patienteId: string;
  type: 'preeclampsie_suspectee' | 'hta_confirmee' | 'signes_graves';
  message: string;
  date: string;
  lu: boolean;
}

export interface Statistiques {
  totalSFE: number;
  totalPatientes: number;
  totalAlertes: number;
  tauxHTAPatientes: number;
  tauxPreeclampsie: number;
  tauxFormationSFE: number;
  repartitionAgePatientes: Record<string, number>;
  repartitionExperienceSFE: Record<string, number>;
  repartitionSuiviTA: Record<string, number>;
  repartitionNiveauInstruction: Record<string, number>;
  tendanceMensuelle: { mois: string; sfe: number; patientes: number }[];
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  role: 'sage-femme' | 'responsable' | 'admin';
  centre: string;
  email: string;
}

// ============================================================
// CONSTANTS
// ============================================================
export const EXPERIENCES = ['Moins de 1 an', '1 à 5 ans', '6 à 10 ans', 'Plus de 10 ans'];
export const FACTEURS_RISQUE = ['Primigestation', 'Grossesse multiple', 'Antécédent d\'HTA', 'Obésité', 'Diabète'];
export const SIGNES_CLINIQUES = ['Céphalées', 'Troubles visuels', 'Saignements', 'Douleurs épigastriques', 'Œdèmes', 'Convulsions'];
export const FREQ_CONTROLE_TA = [
  'Uniquement à la première consultation prénatale',
  'À une consultation prénatale sur deux',
  'À chaque consultation prénatale',
  'Une fois au cours de la grossesse',
];
export const ELEMENTS_HYPERTENDUE = ['Œdèmes', 'Protéinurie', 'Mouvements fœtaux'];
export const CONDUITE_HTA = ['Surveillance rapprochée', 'Référence vers un médecin', 'Hospitalisation', 'Traitement antihypertensif'];
export const ANTIHYPERTENSIFS = ['Méthyldopa', 'Nifédipine'];
export const CONSEILS_HYPERTENSION = [
  'Repos', 'Suivi régulier pds/PA', 'Respect des RDV prénataux',
  'Guetter les signes de danger', 'Consultation en cas de symptômes'
];
export const AGES_PATIENTE = ['Moins de 18 ans', '18 - 25 ans', '26 - 35 ans', '36 ans et plus'];
export const SITUATIONS_MATRIMONIALES = ['Célibataire', 'Mariée', 'Union libre', 'Veuve / Divorcée'];
export const NIVEAUX_INSTRUCTION = ['Aucun', 'Primaire', 'Secondaire', 'Supérieur'];
export const PROFESSIONS = ['Ménagère', 'Commerçante', 'Fonctionnaire', 'Étudiante', 'Autre'];
export const NB_GROSSESSES = ['1', '2 - 3', '4 et plus'];
export const NB_CONSULTATIONS = ['1–2', '3–4', 'Plus de 4', 'Aucun'];
export const SIGNES_ALERTE_PATIENTE = [
  'Maux de tête intenses', 'Vision trouble', 'Gonflement du visage et des pieds',
  'Douleurs épigastriques', 'Convulsions', 'Je ne sais pas'
];
export const SUGGESTIONS_PATIENTE = [
  'Soutien émotionnel et réconfort',
  'Disponibilité des équipements (lit, matériel, médicaments, etc.)',
  'Disponibilité des bilans'
];
export const SUIVIS = ['Sage-femme', 'Médecin', 'Infirmier(e)', 'Autre'];
export const SOURCES_INFO = ['Sage-femme', 'Médecin', 'Famille/Amis', 'Autre'];
export const DIFFICULTES_SFE = [
  'Appareil à tension non fonctionnel',
  'Rupture de bandelettes d’urines',
  'Manque de médicaments (Nifédipine, Loxen, Sulfate de Magnésium)',
  'Manque de formation',
  'Manque de personnel (Absence /insuffisance de gynécologues, de SFE)'
];
export const SIGNES_DANGER_SFE = [
  'Vision troublée', 'Bruits dans les oreilles', 'Céphalées rebelles',
  'Douleurs épigastriques', 'œdèmes généralisés', 'Convulsions'
];

export const Q4_MESURE_TA = ['A chaque consultation', 'Plus fréquemment que d\'habitude', 'Rarement'];
export const Q12_EVALUE_SUIVI = ['Tres bon', 'Bon', 'Moyen', 'Mauvais'];
export const Q14_MESURE_TA_CHAQUE_CONSULT = ['Toujours', 'Parfois', 'Jamais'];
export const Q15_IMPORTANCE_BANDELETTE = ['oui beaucoup', 'un peu', 'Pas du tout'];
export const Q17_INSISTE_BANDELETTE = ['Toujours.', 'Parfois', 'Jamais.'];
export const Q19_POURQUOI_BANDELETTE = ['Detecter le sucre', 'Detecter les proteines.', 'Detecter une maladie.', 'Je ne sais pas exactement'];
export const Q23_ACTION_SF = ['Donner un traitement', 'Referer vers un medecin', 'Rien'];
export const Q25_EXAMENS_DEMANDES = ['oui', 'toujours', 'Parfois', 'Jamais'];
export const Q26_SIGNES_INHABITUELS = ['Aller au à l\'hôpital', 'Automédication'];


export const CENTRES = [
  'Hôpital de Zone de Pobè',
  'Centre de Santé de Kétou',
  "Centre de Santé d'Adja-Ouèrè",
  'Centre de Santé de Malanville',
  'Centre de Santé de Natitingou',
  'Centre de Santé de Parakou',
  'Centre de Santé de Bohicon',
  'Centre de Santé de Ouidah',
  'Centre de Santé de Abomey-Calavi',
  'Centre de Santé de Djougou',
  'Centre de Santé de Savè',
  'Centre de Santé de Tchaourou',
  'Infirmerie Pédiatrique',
  'Autre'
];

// ============================================================
// UTILS
// ============================================================
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function detectAlertePatiente(reponse: Partial<ReponsePatiente>): boolean {
  const signesGraves = ['Maux de tête intenses', 'Vision trouble', 'Convulsions', 'Douleurs épigastriques', 'Gonflement du visage et des pieds'];
  const signesPresents = (reponse.signesAlerte || []).filter(s => signesGraves.includes(s));
  const htaAntecedent = reponse.atcdHtaPreeclampsie === true;
  const nonSuivi = reponse.inscriteCpn === false;
  return signesPresents.length >= 2 || (htaAntecedent && signesPresents.length >= 1) || (nonSuivi && htaAntecedent);
}

export function getScoreConnaissancesSFE(reponse: Partial<ReponseSFE>): number {
  let score = 0;
  if (reponse.defHta === 'TA ≥140/90 mmHg') score += 25;
  if (reponse.caracPreeclampsie === 'HTA + protéinurie') score += 25;
  if (reponse.ageGestationnel === 'Après 20 semaines d\'aménorrhée') score += 25;
  const bonsFacteurs = ['Primigestation', 'Grossesse multiple', 'Antécédent d\'HTA', 'Obésité', 'Diabète'];
  if ((reponse.factRisque || []).filter(f => bonsFacteurs.includes(f)).length >= 3) score += 25;
  return score;
}
