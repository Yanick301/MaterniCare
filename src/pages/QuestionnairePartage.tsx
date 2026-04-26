import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getSharedLink } from '@/hooks/useData';
import {
  generateId, EXPERIENCES, FACTEURS_RISQUE, SIGNES_CLINIQUES, FREQ_CONTROLE_TA,
  ELEMENTS_HYPERTENDUE, CONDUITE_HTA, ANTIHYPERTENSIFS, CONSEILS_HYPERTENSION,
  CENTRES, DIFFICULTES_SFE, SIGNES_DANGER_SFE,
  SITUATIONS_MATRIMONIALES, NIVEAUX_INSTRUCTION, PROFESSIONS, NB_GROSSESSES,
  NB_CONSULTATIONS, SUIVIS, SOURCES_INFO, SIGNES_ALERTE_PATIENTE, SUGGESTIONS_PATIENTE,
  Q4_MESURE_TA, Q12_EVALUE_SUIVI, Q14_MESURE_TA_CHAQUE_CONSULT, Q15_IMPORTANCE_BANDELETTE,
  Q17_INSISTE_BANDELETTE, Q19_POURQUOI_BANDELETTE, Q23_ACTION_SF, Q25_EXAMENS_DEMANDES, Q26_SIGNES_INHABITUELS,
  detectAlertePatiente
} from '@/lib/index';
import type { ReponseSFE, ReponsePatiente } from '@/lib/index';

interface ShareConfig {
  id: string;
  senderName: string;
  senderEmail: string;
  centre: string;
  formType: string;
  userId: string;
  createdAt: string;
}

const SFE_SECTIONS = [
  { id: 1, titre: 'Données sociodémographiques', icon: '👤' },
  { id: 2, titre: 'Connaissances des sages-femmes', icon: '🧠' },
  { id: 3, titre: 'Pratique des sages-femmes', icon: '🩺' },
];

const PATIENT_SECTIONS = [
  { id: 1, titre: 'Sociodémographique', icon: '👤' },
  { id: 2, titre: 'Antécédents', icon: '📋' },
  { id: 3, titre: 'Suivi Prénatal', icon: '🩺' },
  { id: 4, titre: 'Connaissances et Satisfaction', icon: '💡' },
  { id: 5, titre: 'Évaluation du suivi', icon: '📋' },
  { id: 6, titre: 'Prise en charge', icon: '💡' },
  { id: 7, titre: 'Complications', icon: '🚨' },
];

function CheckboxGroup({ options, selected, onChange, other, onOther, otherLabel = 'Autres' }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  other?: string; onOther?: (v: string) => void; otherLabel?: string;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label 
          key={opt} 
          onClick={() => toggle(opt)}
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${selected.includes(opt) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/50'}`}
        >
          <div className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${selected.includes(opt) ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
            {selected.includes(opt) && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
          </div>
          <span className="text-sm text-foreground">{opt}</span>
        </label>
      ))}
      {onOther !== undefined && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 px-1">
          <span>{otherLabel} :</span>
          <Input placeholder="Précisez..." value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm w-full" />
        </div>
      )}
    </div>
  );
}

function RadioGroup({ options, value, onChange, other, onOther, otherLabel = 'Autres' }: {
  options: string[]; value: string; onChange: (v: string) => void;
  other?: string; onOther?: (v: string) => void; otherLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label 
          key={opt} 
          onClick={() => onChange(opt)}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${value === opt ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/50'}`}
        >
          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${value === opt ? 'border-primary' : 'border-muted-foreground/40'}`}>
            {value === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-sm text-foreground">{opt}</span>
        </label>
      ))}
      {onOther !== undefined && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 px-1">
          <span>{otherLabel}: </span>
          <Input placeholder="Précisez..." value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm" />
        </div>
      )}
    </div>
  );
}

const emptySFEForm = (): Partial<ReponseSFE> => ({
  age: null, experiencePro: '', formationHta: false, anneeFormation: '',
  defHta: '', autreDefHta: '', caracPreeclampsie: '', autreCaracPreeclampsie: '',
  ageGestationnel: '', autreAgeGestationnel: '', factRisque: [], autreFactRisque: '',
  signesCliniques: [], autreSignesCliniques: '',
  freqControleTA: '', autreFreqControleTA: '', mesureSystematiqueTA: '',
  recherchProteinurie: '', autreRecherchProteinurie: '',
  surveillanceMvtFoetaux: false, elementsHypertendue: [], autreElementsHypertendue: '',
  conduiteHtaGrossesse: [], autreConduiteHta: '',
  antihypertensifs: [], autreAntihypertensifs: '',
  casReference: '', 
  informeSignesDanger: false, signesDangerExpliques: [],
  conseilsHypertendue: [], autreConseilsHypertendue: '',
  difficultesHta: false, difficultesRencontrees: [], autreDifficultes: '',
  ameliorationsProposees: '', collaborationRelais: false, commentCollaboration: '',
  contreRefRenvoyees: false, pourquoiNonContreRef: '', laboFonctionnel: false
});

const emptyPatientForm = (): Partial<ReponsePatiente> => ({
  nomPatiente: '', prenomPatiente: '', telephonePatiente: '', age: '',
  situationMatrimoniale: '', niveauInstruction: '', profession: '', autreProfession: '', lieuResidence: '',
  nbGrossesses: '', nbEnfantsVivants: '', fauxCouche: false, atcdHtaPreeclampsie: false,
  dejaCesarisee: false, nbCesariennes: '', accoucheApresCesarienne: false,
  inscriteCpn: false, moisDebutCpn: '', nbConsultations: '', suivi: '',
  autreSuivi: '', taMesuree: '', entenduHtaGrossesse: false, dangerHtaMereBebe: false,
  connaissancePreeclampsie: false, sourceInfoPreeclampsie: '', autreSource: '',
  signesAlerte: [], sfExpliqueSgnsDanger: false, conseilsPrevention: false,
  conseilleRevenirRapidement: false, satisfactionSuivi: false, suggestions: [], autreSuggestions: '',
  q1RoleSf: '', q2TensionElevee: '', q3RisqueComplication: '', q4MesureTa: '',
  q5NoteResultats: '', q6RdvRapproches: '', q7RevenirRapidement: '', q8ExpliqueEtat: '',
  q9BienSuivie: '', q10Ecoute: '', q11Confiance: '', q12EvalueSuivi: '',
  q13RoleSfHta: '', q14MesureTaChaqueConsult: '', q15ImportanceBandelette: '',
  q16BandeletteDetecteComplication: '', q17InsisteBandelette: '', q18SaitPourquoiBandelette: '',
  q19PourquoiBandelette: [], q20ComprendExplications: '', q21PoseQuestions: '',
  q22TensionEleveeGrossesse: '', q23ActionSf: '', q24RegulierementSuivie: '',
  q25ExamensDemandes: '', q26SignesInhabituels: [],
});

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const snake: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();
    snake[snakeKey] = obj[key];
  }
  return snake;
}

export default function QuestionnairePartage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ShareConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<any>({});
  const [centre, setCentre] = useState('');
  const [customCentre, setCustomCentre] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(0);

  const up = (field: string, value: unknown) => setForm((f: any) => ({ ...f, [field]: value }));

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const link = await getSharedLink(shareId);
        if (!link) { setNotFound(true); setLoading(false); return; }
        setConfig(link);
        setForm(link.formType === 'sfe' ? emptySFEForm() : emptyPatientForm());
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [shareId]);

  const handleSubmit = async () => {
    if (!config) return;
    setSubmitting(true);
    try {
      const isSFE = config.formType === 'sfe';
      const r: any = {
        id: generateId(),
        date: new Date().toISOString(),
        sageFemme: config.senderName,
        centre: (centre === 'Autre' ? customCentre : centre) || config.centre,
        ...form,
        source: 'partage',
        statut: 'complet',
        alerte: isSFE ? false : detectAlertePatiente(form),
      };
      
      const data = toSnakeCase(r as Record<string, unknown>);
      data.user_id = config.userId;
      
      const table = isSFE ? 'surveys_sfe' : 'surveys_patientes';
      const { error } = await supabase.from(table).insert(data);
      
      if (error) throw error;
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Lien invalide ou expiré</h2>
          <p className="text-sm text-slate-500">Ce questionnaire n'est plus disponible ou le lien est incorrect.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }} className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Merci !</h2>
              <p className="text-slate-500 mt-2 text-sm">Votre réponse a été enregistrée avec succès.</p>
            </div>
            <p className="text-xs text-slate-400">Enquête pour {config.senderName}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const SECTIONS = config.formType === 'sfe' ? SFE_SECTIONS : PATIENT_SECTIONS;
  const isLast = section === SECTIONS.length - 1;
  const progress = ((section + 1) / SECTIONS.length) * 100;

  const renderSFEFields = () => {
    switch (section) {
      case 0: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Âge (en année révolue)</Label>
            <Input type="number" placeholder="Ex: 35" value={form.age ?? ''} onChange={e => up('age', parseInt(e.target.value) || null)} className="h-11 text-lg max-w-sm" min={18} max={80} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Centre de santé / Hôpital</Label>
            <select value={centre} onChange={e => setCentre(e.target.value)} className="w-full h-11 border-2 border-input rounded-lg px-3 text-sm bg-background outline-none">
              <option value="">Sélectionner…</option>
              {CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {centre === 'Autre' && (
              <Input placeholder="Nom du centre" value={customCentre} onChange={e => setCustomCentre(e.target.value)} className="h-11 border-2 mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Nombre d'année d'expérience professionnelle</Label>
            <RadioGroup options={EXPERIENCES} value={form.experiencePro || ''} onChange={v => up('experiencePro', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Avez-vous déjà reçu une formation sur la prise en charge de la HTA et de la prééclampsie ? (SONU)</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.formationHta ? 'Oui' : form.formationHta === false ? 'Non' : ''} onChange={v => up('formationHta', v === 'Oui')} />
            {form.formationHta && (
              <div className="mt-2">
                <Label className="text-sm">Si oui en quelle année ?</Label>
                <Input placeholder="Année (ex: 2023)" value={form.anneeFormation || ''} onChange={e => up('anneeFormation', e.target.value)} className="h-10 mt-1 max-w-sm" maxLength={4} />
              </div>
            )}
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">L'hypertension artérielle pendant la grossesse se définit par :</Label>
            <RadioGroup options={['TA ≥ 140/90 mmHg']} value={form.defHta || ''} onChange={v => up('defHta', v)} other={form.autreDefHta} onOther={v => up('autreDefHta', v)} otherLabel="Autre" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">La prééclampsie est caractérisée par :</Label>
            <RadioGroup options={['HTA + protéinurie']} value={form.caracPreeclampsie || ''} onChange={v => up('caracPreeclampsie', v)} other={form.autreCaracPreeclampsie} onOther={v => up('autreCaracPreeclampsie', v)} otherLabel="Autre" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">À partir de quel âge gestationnel peut apparaître la prééclampsie :</Label>
            <RadioGroup options={['Après 20 semaines d\'aménorrhée']} value={form.ageGestationnel || ''} onChange={v => up('ageGestationnel', v)} other={form.autreAgeGestationnel} onOther={v => up('autreAgeGestationnel', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quels sont les principaux facteurs de risque de la prééclampsie :</Label>
            <CheckboxGroup options={FACTEURS_RISQUE} selected={form.factRisque || []} onChange={v => up('factRisque', v)} other={form.autreFactRisque} onOther={v => up('autreFactRisque', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quels sont les signes cliniques évocateurs de la prééclampsie :</Label>
            <CheckboxGroup options={SIGNES_CLINIQUES} selected={form.signesCliniques || []} onChange={v => up('signesCliniques', v)} other={form.autreSignesCliniques} onOther={v => up('autreSignesCliniques', v)} otherLabel="Autres" />
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">À quelle fréquence contrôlez-vous la tension artérielle chez les femmes enceintes ?</Label>
            <RadioGroup options={FREQ_CONTROLE_TA} value={form.freqControleTA || ''} onChange={v => up('freqControleTA', v)} other={form.autreFreqControleTA} onOther={v => up('autreFreqControleTA', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Mesurez-vous systématiquement la TA chez les femmes enceintes ?</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.mesureSystematiqueTA || ''} onChange={v => up('mesureSystematiqueTA', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">La recherche de la protéinurie fait partie du bilan prénatal</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.recherchProteinurie || ''} onChange={v => up('recherchProteinurie', v)} other={form.autreRecherchProteinurie} onOther={v => up('autreRecherchProteinurie', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Surveillez-vous les mouvements fœtaux ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.surveillanceMvtFoetaux ? 'Oui' : form.surveillanceMvtFoetaux === false ? 'Non' : ''} onChange={v => up('surveillanceMvtFoetaux', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Éléments à rechercher chez une femme hypertendue :</Label>
            <CheckboxGroup options={ELEMENTS_HYPERTENDUE} selected={form.elementsHypertendue || []} onChange={v => up('elementsHypertendue', v)} other={form.autreElementsHypertendue} onOther={v => up('autreElementsHypertendue', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Conduite à tenir en cas d'HTA chez une femme enceinte :</Label>
            <CheckboxGroup options={CONDUITE_HTA} selected={form.conduiteHtaGrossesse || []} onChange={v => up('conduiteHtaGrossesse', v)} other={form.autreConduiteHta} onOther={v => up('autreConduiteHta', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Antihypertensifs utilisables pendant la grossesse :</Label>
            <CheckboxGroup options={ANTIHYPERTENSIFS} selected={form.antihypertensifs || []} onChange={v => up('antihypertensifs', v)} other={form.autreAntihypertensifs} onOther={v => up('autreAntihypertensifs', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Dans quel cas décidez vous de référer une patiente (considérant que vous travaillez dans un centre périphérique) ?</Label>
            <CheckboxGroup options={['HTA sévère', 'Signe de prééclampsie sévère']} selected={form.casReference ? form.casReference.split(', ') : []} onChange={v => up('casReference', v.join(', '))} other={form.casReference && !['HTA sévère', 'Signe de prééclampsie sévère'].includes(form.casReference) ? form.casReference : ''} onOther={v => up('casReference', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Informez-vous les femmes enceintes sur les signes de danger de la prééclampsie ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.informeSignesDanger ? 'Oui' : form.informeSignesDanger === false ? 'Non' : ''} onChange={v => up('informeSignesDanger', v === 'Oui')} />
            {form.informeSignesDanger && (
              <div className="mt-2">
                <Label className="text-sm">Si oui quels sont ces signes de danger ?</Label>
                <CheckboxGroup options={SIGNES_DANGER_SFE} selected={form.signesDangerExpliques || []} onChange={v => up('signesDangerExpliques', v)} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quels conseils donnez-vous pour femmes enceintes hypertendues ?</Label>
            <CheckboxGroup options={CONSEILS_HYPERTENSION} selected={form.conseilsHypertendue || []} onChange={v => up('conseilsHypertendue', v)} other={form.autreConseilsHypertendue} onOther={v => up('autreConseilsHypertendue', v)} otherLabel="Autres" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Rencontrez-vous des difficultés dans la surveillance et la prise en charge de l'HTA et de la prééclampsie ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.difficultesHta ? 'Oui' : form.difficultesHta === false ? 'Non' : ''} onChange={v => up('difficultesHta', v === 'Oui')} />
            {form.difficultesHta && (
              <div className="mt-2">
                <Label className="text-sm">Si oui, lesquelles ?</Label>
                <CheckboxGroup options={DIFFICULTES_SFE} selected={form.difficultesRencontrees || []} onChange={v => up('difficultesRencontrees', v)} other={form.autreDifficultes} onOther={v => up('autreDifficultes', v)} otherLabel="Autres" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quelles améliorations proposez-vous pour une meilleure prise en charge de l'HTA et de la prééclampsie chez la femme enceinte ?</Label>
            <Textarea placeholder="Vos suggestions…" value={form.ameliorationsProposees || ''} onChange={e => up('ameliorationsProposees', e.target.value)} className="min-h-16 resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Collaborez-vous avec les relais communautaires dans le suivi des gestantes hypertendues prises en charge?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.collaborationRelais ? 'Oui' : form.collaborationRelais === false ? 'Non' : ''} onChange={v => up('collaborationRelais', v === 'Oui')} />
            {form.collaborationRelais && (
              <div className="mt-2">
                <Label className="text-sm">Si oui, comment ?</Label>
                <Textarea value={form.commentCollaboration || ''} onChange={e => up('commentCollaboration', e.target.value)} className="min-h-16 resize-none" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Suite à une référence en cas d’HTA, les fiches de contre-référence sont-elles renvoyées vers les centres ayant référé ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.contreRefRenvoyees ? 'Oui' : form.contreRefRenvoyees === false ? 'Non' : ''} onChange={v => up('contreRefRenvoyees', v === 'Oui')} />
            {!form.contreRefRenvoyees && form.contreRefRenvoyees === false && (
              <div className="mt-2">
                <Label className="text-sm">Si non, pourquoi ?</Label>
                <Textarea value={form.pourquoiNonContreRef || ''} onChange={e => up('pourquoiNonContreRef', e.target.value)} className="min-h-16 resize-none mt-2" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Le centre dispose-t-il d'un service de laboratoire fonctionnel pour les examens biologiques ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.laboFonctionnel ? 'Oui' : form.laboFonctionnel === false ? 'Non' : ''} onChange={v => up('laboFonctionnel', v === 'Oui')} />
          </div>
        </div>
      );

      default: return null;
    }
  };

  const renderPatientFields = () => {
    switch (section) {
      case 0: return (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de la patiente</Label>
              <Input placeholder="Nom" value={form.nomPatiente || ''} onChange={e => up('nomPatiente', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Prénom de la patiente</Label>
              <Input placeholder="Prénom" value={form.prenomPatiente || ''} onChange={e => up('prenomPatiente', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input placeholder="Ex: 01020304" value={form.telephonePatiente || ''} onChange={e => up('telephonePatiente', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Âge</Label>
            <select value={form.age || ''} onChange={e => up('age', e.target.value)} className="w-full h-11 border-2 rounded-lg px-3 outline-none">
              <option value="">Sélectionner...</option>
              {['Moins de 18 ans', '18 - 25 ans', '26 - 35 ans', '36 ans et plus'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Situation matrimoniale</Label>
            <RadioGroup options={['Célibataire', 'Mariée', 'Union libre', 'Veuve / Divorcée']} value={form.situationMatrimoniale || ''} onChange={v => up('situationMatrimoniale', v)} />
          </div>
          <div className="space-y-2">
            <Label>Niveau d'instruction</Label>
            <RadioGroup options={['Aucun', 'Primaire', 'Secondaire', 'Supérieur']} value={form.niveauInstruction || ''} onChange={v => up('niveauInstruction', v)} />
          </div>
          <div className="space-y-2">
            <Label>Profession</Label>
            <RadioGroup options={['Ménagère', 'Commerçante', 'Fonctionnaire', 'Étudiante', 'Autre']} value={form.profession || ''} onChange={v => up('profession', v)} other={form.autreProfession} onOther={v => up('autreProfession', v)} />
          </div>
          <div className="space-y-2">
            <Label>Lieu de résidence</Label>
            <RadioGroup options={['Urbain', 'Rural']} value={form.lieuResidence || ''} onChange={v => up('lieuResidence', v)} />
          </div>
          <div className="space-y-2">
            <Label>Centre de santé / Hôpital</Label>
            <select value={centre} onChange={e => setCentre(e.target.value)} className="w-full h-11 border-2 border-input rounded-lg px-3 text-sm bg-background outline-none">
              <option value="">Sélectionner…</option>
              {CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {centre === 'Autre' && (
              <Input placeholder="Nom du centre" value={customCentre} onChange={e => setCustomCentre(e.target.value)} className="h-11 border-2 mt-2" />
            )}
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Nombre de grossesses</Label>
            <RadioGroup options={['1', '2 - 3', '4 et plus']} value={form.nbGrossesses || ''} onChange={v => up('nbGrossesses', v)} />
          </div>
          <div className="space-y-2">
            <Label>Nombre d'enfants vivants</Label>
            <Input type="number" value={form.nbEnfantsVivants || ''} onChange={e => up('nbEnfantsVivants', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Avez vous déjà fait une fausse couche ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.fauxCouche ? 'Oui' : form.fauxCouche === false ? 'Non' : ''} onChange={v => up('fauxCouche', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Avez vous un antécédent d'hypertension artérielle ou de prééclampsie ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.atcdHtaPreeclampsie ? 'Oui' : form.atcdHtaPreeclampsie === false ? 'Non' : ''} onChange={v => up('atcdHtaPreeclampsie', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Avez vous déjà été césarisée ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.dejaCesarisee ? 'Oui' : form.dejaCesarisee === false ? 'Non' : ''} onChange={v => up('dejaCesarisee', v === 'Oui')} />
            {form.dejaCesarisee && (
              <div className="mt-2 space-y-2 p-3 bg-secondary/30 rounded-xl">
                <Label>Si oui combien de fois ?</Label>
                <Input type="number" value={form.nbCesariennes || ''} onChange={e => up('nbCesariennes', e.target.value)} className="h-10" />
                <Label className="block mt-2">Avez vous accouché après la césarienne ?</Label>
                <RadioGroup options={['Oui', 'Non']} value={form.accoucheApresCesarienne ? 'Oui' : form.accoucheApresCesarienne === false ? 'Non' : ''} onChange={v => up('accoucheApresCesarienne', v === 'Oui')} />
              </div>
            )}
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Êtes vous inscrite à la consultation prénatale ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.inscriteCpn ? 'Oui' : form.inscriteCpn === false ? 'Non' : ''} onChange={v => up('inscriteCpn', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>À quel mois de la grossesse avez vous commencé les consultations prénatales ?</Label>
            <RadioGroup options={['1er trimestre', '2ème trimestre', '3ème trimestre']} value={form.moisDebutCpn || ''} onChange={v => up('moisDebutCpn', v)} />
          </div>
          <div className="space-y-2">
            <Label>Combien de consultations prénatales avez-vous déjà effectuées</Label>
            <RadioGroup options={['1–2', '3–4', 'Plus de 4', 'Aucun']} value={form.nbConsultations || ''} onChange={v => up('nbConsultations', v)} />
          </div>
          <div className="space-y-2">
            <Label>Qui assure le suivi de votre grossesse ?</Label>
            <RadioGroup options={['Sage-femme', 'Médecin', 'Infirmier(e)', 'Autre']} value={form.suivi || ''} onChange={v => up('suivi', v)} other={form.autreSuivi} onOther={v => up('autreSuivi', v)} />
          </div>
          <div className="space-y-2">
            <Label>Lors des consultations prénatales, la tension artérielle est-elle mesurée?</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.taMesuree || ''} onChange={v => up('taMesuree', v)} />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Avez vous déjà entendu parler de l'hypertension artérielle pendant la grossesse</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.entenduHtaGrossesse ? 'Oui' : form.entenduHtaGrossesse === false ? 'Non' : ''} onChange={v => up('entenduHtaGrossesse', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Savez-vous que l'hypertension peut être dangereuse pour la mère et le bébé ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.dangerHtaMereBebe ? 'Oui' : form.dangerHtaMereBebe === false ? 'Non' : ''} onChange={v => up('dangerHtaMereBebe', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Connaissez-vous la prééclampsie ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.connaissancePreeclampsie ? 'Oui' : form.connaissancePreeclampsie === false ? 'Non' : ''} onChange={v => up('connaissancePreeclampsie', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Par qui avez-vous entendu parler de la prééclampsie ?</Label>
            <RadioGroup options={['Sage-femme', 'Médecin', 'Famille/Amis', 'Autre']} value={form.sourceInfoPreeclampsie || ''} onChange={v => up('sourceInfoPreeclampsie', v)} other={form.autreSource} onOther={v => up('autreSource', v)} />
          </div>
          <div className="space-y-2">
            <Label>Quels signes peuvent alerter une femme enceinte ?</Label>
            <CheckboxGroup options={['Maux de tête intenses', 'Vision trouble', 'Gonflement du visage et des pieds', 'Douleurs épigastriques', 'Convulsions', 'Je ne sais pas']} selected={form.signesAlerte || []} onChange={v => up('signesAlerte', v)} />
          </div>
          <div className="space-y-2">
            <Label>La sage-femme vous explique-t-elle les signes de danger pendant la grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.sfExpliqueSgnsDanger ? 'Oui' : form.sfExpliqueSgnsDanger === false ? 'Non' : ''} onChange={v => up('sfExpliqueSgnsDanger', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Vous donne-t-elle des conseils pour prévenir les complications de la grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.conseilsPrevention ? 'Oui' : form.conseilsPrevention === false ? 'Non' : ''} onChange={v => up('conseilsPrevention', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Vous conseille-t-elle de revenir rapidement en cas de symptômes inhabituels ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.conseilleRevenirRapidement ? 'Oui' : form.conseilleRevenirRapidement === false ? 'Non' : ''} onChange={v => up('conseilleRevenirRapidement', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Êtes-vous satisfaite de la surveillance faite par la sage-femme pendant votre grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.satisfactionSuivi ? 'Oui' : form.satisfactionSuivi === false ? 'Non' : ''} onChange={v => up('satisfactionSuivi', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>Que suggérez-vous pour améliorer les soins ?</Label>
            <CheckboxGroup options={['Soutien émotionnel et réconfort', 'Disponibilité des équipements', 'Disponibilité des bilans']} selected={form.suggestions || []} onChange={v => up('suggestions', v)} />
            <Textarea placeholder="Autre suggestions..." value={form.autreSuggestions || ''} onChange={e => up('autreSuggestions', e.target.value)} className="mt-2" />
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>24. Pensez vous que la sage femme joue un rôle important dans la prévention de l'hypertension artérielle</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q1RoleSf || ''} onChange={v => up('q1RoleSf', v)} />
          </div>
          <div className="space-y-2">
            <Label>25. La sage femme vous a-t-elle déjà dit que vous avez une tension élevée ?</Label>
            <RadioGroup options={['Oui', 'Non', 'Je ne sais pas']} value={form.q2TensionElevee || ''} onChange={v => up('q2TensionElevee', v)} />
          </div>
          <div className="space-y-2">
            <Label>26. Vous a-t-elle expliqué que vous êtes à risque de complications comme la prééclampsie ?</Label>
            <RadioGroup options={['Oui clairement', 'Non']} value={form.q3RisqueComplication || ''} onChange={v => up('q3RisqueComplication', v)} />
          </div>
          <div className="space-y-2">
            <Label>27. Depuis que votre tension est élevée, la mesure de la tension artérielle est faite:</Label>
            <RadioGroup options={Q4_MESURE_TA} value={form.q4MesureTa || ''} onChange={v => up('q4MesureTa', v)} />
          </div>
          <div className="space-y-2">
            <Label>28. La Sage femme note-t-elle vos résultats dans votre carnet ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q5NoteResultats || ''} onChange={v => up('q5NoteResultats', v)} />
          </div>
          <div className="space-y-2">
            <Label>29. Avez-vous eu des rendez-vous rapprochés à cause de votre tension ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q6RdvRapproches || ''} onChange={v => up('q6RdvRapproches', v)} />
          </div>
          <div className="space-y-2">
            <Label>30. La Sage femme vous demande-t-elle de revenir rapidement en cas de problème ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q7RevenirRapidement || ''} onChange={v => up('q7RevenirRapidement', v)} />
          </div>
          <div className="space-y-2">
            <Label>31. La sage femme vous explique t-elle claire ment votre etat de santé ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q8ExpliqueEtat || ''} onChange={v => up('q8ExpliqueEtat', v)} />
          </div>
          <div className="space-y-2">
            <Label>32. Vous sentez vous bien qsuivie par la Sage femme?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q9BienSuivie || ''} onChange={v => up('q9BienSuivie', v)} />
          </div>
          <div className="space-y-2">
            <Label>33. Prend elle le temps de vous ecouter?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q10Ecoute || ''} onChange={v => up('q10Ecoute', v)} />
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>34. Vous met-elle en confiance?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q11Confiance || ''} onChange={v => up('q11Confiance', v)} />
          </div>
          <div className="space-y-2">
            <Label>35. Comment evaluez vous globalement le suivi de votre grossesse ?</Label>
            <RadioGroup options={Q12_EVALUE_SUIVI} value={form.q12EvalueSuivi || ''} onChange={v => up('q12EvalueSuivi', v)} />
          </div>
          <div className="space-y-2">
            <Label>36. Selon vous la Sage femme joue t-elle un rôle important dans la prévention des complications liées à l'hypertension artérielle?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q13RoleSfHta || ''} onChange={v => up('q13RoleSfHta', v)} />
          </div>
          <div className="space-y-2">
            <Label>37. La sage femme mesure t-elle votre tension arterielle à chaque consultation</Label>
            <RadioGroup options={Q14_MESURE_TA_CHAQUE_CONSULT} value={form.q14MesureTaChaqueConsult || ''} onChange={v => up('q14MesureTaChaqueConsult', v)} />
          </div>
          <div className="space-y-2">
            <Label>38. Insiste-t-elle pour l'importance de la bandelette urinaire?</Label>
            <RadioGroup options={Q15_IMPORTANCE_BANDELETTE} value={form.q15ImportanceBandelette || ''} onChange={v => up('q15ImportanceBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>39. Vous a-t-elle dit que cet examen permet de detecter les complications comme la prééclampsie?</Label>
            <RadioGroup options={['oui', 'Non', 'Je ne sais pas']} value={form.q16BandeletteDetecteComplication || ''} onChange={v => up('q16BandeletteDetecteComplication', v)} />
          </div>
          <div className="space-y-2">
            <Label>40. La sage femme insiste t-elle pour que vous fassiez la bandelette urinaire à chaque consultation ?</Label>
            <RadioGroup options={Q17_INSISTE_BANDELETTE} value={form.q17InsisteBandelette || ''} onChange={v => up('q17InsisteBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>41. Saviez vous pourquoi on fait la bandelette urinaire?</Label>
            <RadioGroup options={['oui', 'Non']} value={form.q18SaitPourquoiBandelette || ''} onChange={v => up('q18SaitPourquoiBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>42. Si oui, pourquoi ?</Label>
            <CheckboxGroup options={Q19_POURQUOI_BANDELETTE} selected={form.q19PourquoiBandelette || []} onChange={v => up('q19PourquoiBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>43. Comprenez vous facilement les explications des sages femmes?</Label>
            <RadioGroup options={['Non', 'oui']} value={form.q20ComprendExplications || ''} onChange={v => up('q20ComprendExplications', v)} />
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>44. Avez vous la possibilité de poser des questions?</Label>
            <RadioGroup options={['oui', 'Non']} value={form.q21PoseQuestions || ''} onChange={v => up('q21PoseQuestions', v)} />
          </div>
          <div className="space-y-2">
            <Label>45. Avez vous deja fait une tension elevee pendant cette grossesse?</Label>
            <RadioGroup options={['oui', 'Non', 'Je ne sais pas']} value={form.q22TensionEleveeGrossesse || ''} onChange={v => up('q22TensionEleveeGrossesse', v)} />
          </div>
          <div className="space-y-2">
            <Label>46. Si oui, qu'a fait la Sage femme?</Label>
            <RadioGroup options={Q23_ACTION_SF} value={form.q23ActionSf || ''} onChange={v => up('q23ActionSf', v)} />
          </div>
          <div className="space-y-2">
            <Label>47. Êtes vous régulièrement suivie apres un problème?</Label>
            <RadioGroup options={['oui', 'Non']} value={form.q24RegulierementSuivie || ''} onChange={v => up('q24RegulierementSuivie', v)} />
          </div>
          <div className="space-y-2">
            <Label>48. Faites vous les examens demandés?</Label>
            <RadioGroup options={Q25_EXAMENS_DEMANDES} value={form.q25ExamensDemandes || ''} onChange={v => up('q25ExamensDemandes', v)} />
          </div>
          <div className="space-y-2">
            <Label>49. En cas de signes inhabituels (maux de tête, oedemes, vision floue...), que faites vous?</Label>
            <CheckboxGroup options={Q26_SIGNES_INHABITUELS} selected={form.q26SignesInhabituels || []} onChange={v => up('q26SignesInhabituels', v)} />
          </div>
        </div>
      );
      default: return null;
    }
  };

  const renderSection = () => {
    return config.formType === 'sfe' ? renderSFEFields() : renderPatientFields();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/icon.png" alt="MaterniCare" className="w-8 h-8 rounded-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {config.formType === 'sfe' ? 'Enquête Sage-Femme' : 'Enquête Patiente'}
            </h1>
            <p className="text-xs text-slate-500 truncate">Partagée par {config.senderName}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">Section {section + 1}/{SECTIONS.length}</Badge>
        </div>
        <div className="h-1 bg-slate-100">
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} className="h-full bg-primary rounded-full" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 pb-28">
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setDirection(i > section ? 1 : -1); setSection(i); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${i === section ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : i < section ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}
            >
              {i < section ? '✓' : s.icon} {s.titre}
            </button>
          ))}
        </div>

        <motion.div
          key={section}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">{SECTIONS[section].icon}</span>
                <span>{SECTIONS[section].titre}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-6">{renderSection()}</CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(var(--safe-area-bottom,0px)+16px)] bg-white/90 backdrop-blur-lg border-t border-slate-200 z-30">
        <div className="max-w-3xl mx-auto flex gap-3">
          {section > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => { setDirection(-1); setSection(s => s - 1); }}
              className="gap-2 h-12 rounded-xl text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </Button>
          )}
          <div className="flex-1" />
          {!isLast ? (
            <Button
              onClick={() => { setDirection(1); setSection(s => s + 1); }}
              size="lg"
              className="gap-2 h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-bold"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="gap-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 text-xs font-bold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
