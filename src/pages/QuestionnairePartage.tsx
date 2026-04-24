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
  CENTRES, DIFFICULTES_SFE, SIGNES_DANGER_SFE
} from '@/lib/index';
import type { ReponseSFE } from '@/lib/index';

interface ShareConfig {
  id: string;
  senderName: string;
  senderEmail: string;
  centre: string;
  formType: string;
  userId: string;
  createdAt: string;
}

const SECTIONS = [
  { id: 1, titre: 'Données sociodémographiques', icon: '👤' },
  { id: 2, titre: 'Connaissances des sages-femmes', icon: '🧠' },
  { id: 3, titre: 'Pratique des sages-femmes', icon: '🩺' },
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

const emptyForm = (): Partial<ReponseSFE> => ({
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

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const snake: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
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
  const [form, setForm] = useState<Partial<ReponseSFE>>(emptyForm());
  const [centre, setCentre] = useState('');
  const [customCentre, setCustomCentre] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(0);

  const up = (field: keyof ReponseSFE, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const link = await getSharedLink(shareId);
        if (!link) { setNotFound(true); setLoading(false); return; }
        setConfig(link);
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
      const r: ReponseSFE = {
        id: generateId(),
        date: new Date().toISOString(),
        sageFemme: config.senderName,
        centre: (centre === 'Autre' ? customCentre : centre) || config.centre,
        ...(form as ReponseSFE),
        statut: 'complet',
        alerte: false,
      };
      const data = toSnakeCase(r as unknown as Record<string, unknown>);
      data.user_id = config.userId;
      const { error } = await supabase.from('surveys_sfe').insert(data);
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

  const isLast = section === SECTIONS.length - 1;
  const progress = ((section + 1) / SECTIONS.length) * 100;

  const renderSection = () => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/icon.png" alt="MaterniCare" className="w-8 h-8 rounded-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">Enquête Sage-Femme</h1>
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
