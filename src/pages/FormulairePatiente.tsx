import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Save, CheckCircle, Zap, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePatientesData, useAuth } from '@/hooks/useData';
import {
  generateId, ROUTE_PATHS, AGES_PATIENTE, SITUATIONS_MATRIMONIALES, NIVEAUX_INSTRUCTION,
  PROFESSIONS, NB_GROSSESSES, NB_CONSULTATIONS, SIGNES_ALERTE_PATIENTE, SUGGESTIONS_PATIENTE,
  SUIVIS, SOURCES_INFO, CENTRES, detectAlertePatiente
} from '@/lib/index';
import type { ReponsePatiente, FormMode } from '@/lib/index';

const SECTIONS = [
  { id: 1, titre: 'Sociodémographique', icon: '👤' },
  { id: 2, titre: 'Antécédents', icon: '📋' },
  { id: 3, titre: 'Suivi Prénatal', icon: '🩺' },
  { id: 4, titre: 'Connaissances et Satisfaction', icon: '💡' },
];

function CheckboxGroup({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; }) {
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
    </div>
  );
}

function RadioGroup({ options, value, onChange, other, onOther, otherLabel = 'Autre' }: {
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
          <span>{otherLabel}:</span>
          <Input placeholder="Précisez..." value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm" />
        </div>
      )}
    </div>
  );
}

const emptyForm = (): Partial<ReponsePatiente> => ({
  nomPatiente: '', prenomPatiente: '', telephonePatiente: '',
  age: '', situationMatrimoniale: '', niveauInstruction: '', profession: '', autreProfession: '',
  lieuResidence: '', nbGrossesses: '', nbEnfantsVivants: '', fauxCouche: false,
  atcdHtaPreeclampsie: false, dejaCesarisee: false, nbCesariennes: '', accoucheApresCesarienne: false,
  inscriteCpn: false, moisDebutCpn: '', nbConsultations: '', suivi: '',
  autreSuivi: '', taMesuree: '', entenduHtaGrossesse: false, dangerHtaMereBebe: false,
  connaissancePreeclampsie: false, sourceInfoPreeclampsie: '', autreSource: '',
  signesAlerte: [], sfExpliqueSgnsDanger: false, conseilsPrevention: false,
  conseilleRevenirRapidement: false, satisfactionSuivi: false, suggestions: [], autreSuggestions: ''
});

export default function FormulairePatiente() {
  const [mode, setMode] = useState<FormMode | null>(null);
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<Partial<ReponsePatiente>>(emptyForm());
  const [centre, setCentre] = useState('');
  const [customCentre, setCustomCentre] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0); 
  const { save } = usePatientesData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const up = (field: keyof ReponsePatiente, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async (statut: 'complet' | 'brouillon') => {
    setLoading(true);
    try {
      const isAlert = detectAlertePatiente(form);
      const r: ReponsePatiente = {
        id: generateId(),
        date: new Date().toISOString(),
        sageFemme: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        centre: (centre === 'Autre' ? customCentre : centre) || user?.centre || '',
        ...(form as ReponsePatiente),
        statut,
        alerte: isAlert,
      };
      await save(r);
      toast.success('Dossier patiente enregistré avec succès');
      setSaved(true);
      setTimeout(() => navigate(ROUTE_PATHS.HISTORIQUE), 1500);
    } catch (err: any) {
      toast.error(`Erreur lors de l'enregistrement : ${err.message || 'Problème de connexion'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTE_PATHS.DASHBOARD)} className="mb-4 gap-2 text-muted-foreground mt-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-foreground mb-1 mt-4">Questionnaire aux Femmes Enceintes</h1>
          <p className="text-muted-foreground mb-8 text-sm">Choisissez le mode de saisie pour la patiente</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card onClick={() => setMode('patient')} className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 h-full">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">Question par question</h3>
                  <p className="text-sm text-muted-foreground">Remplissage interactif avec la patiente en face de vous.</p>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Recommandé</Badge>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card onClick={() => setMode('registre')} className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 h-full">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Zap className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">Mode Registre</h3>
                  <p className="text-sm text-muted-foreground">Saisie expéditive depuis un carnet ou dossier médical existant.</p>
                  <Badge variant="outline" className="text-xs">Rapide</Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Dossier enregistré !</h2>
        <p className="text-muted-foreground mt-1">Redirection vers l'historique…</p>
      </div>
    );
  }

  const isLast = section === SECTIONS.length - 1;
  const progress = ((section + 1) / SECTIONS.length) * 100;

  const renderSection = () => {
    switch (section) {
      case 0: return (
        <div className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-xl text-primary text-sm mb-4">
            <h3 className="font-bold mb-1">Informations générales d'identification</h3>
            <p>Pour identifier la patiente plus facilement dans le registre plus tard (Non inclus dans les chiffres, usage interne).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input placeholder="Nom" value={form.nomPatiente || ''} onChange={e => up('nomPatiente', e.target.value)} className="h-11 border-2" />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input placeholder="Prénom" value={form.prenomPatiente || ''} onChange={e => up('prenomPatiente', e.target.value)} className="h-11 border-2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Numéro de téléphone</Label>
            <Input placeholder="Tel" value={form.telephonePatiente || ''} onChange={e => up('telephonePatiente', e.target.value)} className="h-11 border-2" />
          </div>
          <div className="space-y-2">
            <Label>Centre / Structure de suivi</Label>
            <select value={centre} onChange={e => setCentre(e.target.value)} className="w-full h-11 border-2 border-input rounded-lg px-3 text-sm bg-background outline-none">
              <option value="">Sélectionner…</option>
              {CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {centre === 'Autre' && (
              <Input placeholder="Nom de votre structure" value={customCentre} onChange={e => setCustomCentre(e.target.value)} className="h-11 border-2 mt-2" />
            )}
          </div>
          <hr className="my-6" />
          <h2 className="font-bold text-lg">I - Informations socio-démographiques</h2>
          <div className="space-y-2">
            <Label className="text-base font-semibold">1. Âge</Label>
            <RadioGroup options={AGES_PATIENTE} value={form.age || ''} onChange={v => up('age', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">2. Situation matrimoniale</Label>
            <RadioGroup options={SITUATIONS_MATRIMONIALES} value={form.situationMatrimoniale || ''} onChange={v => up('situationMatrimoniale', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">3. Niveau d'instruction</Label>
            <RadioGroup options={NIVEAUX_INSTRUCTION} value={form.niveauInstruction || ''} onChange={v => up('niveauInstruction', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">4. Profession</Label>
            <RadioGroup options={PROFESSIONS} value={form.profession || ''} onChange={v => up('profession', v)} other={form.autreProfession} onOther={v => up('autreProfession', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">5. Lieu de résidence</Label>
            <RadioGroup options={['Urbain', 'Rural']} value={form.lieuResidence || ''} onChange={v => up('lieuResidence', v)} />
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-6">
          <h2 className="font-bold text-lg">II - Antécédents obstétricaux</h2>
          <div className="space-y-2">
            <Label className="text-base font-semibold">6. Combien de grossesses avez-vous déjà eu ?</Label>
            <RadioGroup options={['1', '2 - 3', '4 et plus']} value={form.nbGrossesses || ''} onChange={v => up('nbGrossesses', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">7. Combien d'enfants vivants avez-vous ?</Label>
            <RadioGroup options={['0', '1 - 2', '3 et plus']} value={form.nbEnfantsVivants || ''} onChange={v => up('nbEnfantsVivants', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">8. Avez-vous déjà fait une fausse couche ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.fauxCouche ? 'Oui' : form.fauxCouche === false ? 'Non' : ''} onChange={v => up('fauxCouche', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">9. Avez vous déjà fait une hypertension artérielle prééclamptique à une grossesse précédente ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.atcdHtaPreeclampsie ? 'Oui' : form.atcdHtaPreeclampsie === false ? 'Non' : ''} onChange={v => up('atcdHtaPreeclampsie', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">10. Avez-vous déjà été cesarisée ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.dejaCesarisee ? 'Oui' : form.dejaCesarisee === false ? 'Non' : ''} onChange={v => up('dejaCesarisee', v === 'Oui')} />
            {form.dejaCesarisee && (
              <>
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 px-1">
                  <span>Si oui, combien de fois ?</span>
                  <Input type="number" placeholder="Nb" value={form.nbCesariennes || ''} onChange={e => up('nbCesariennes', e.target.value)} className="h-9 w-20 text-sm" />
                </div>
                <div className="mt-4">
                  <Label className="text-sm font-semibold">Avez-vous déjà accouché après cette première césarienne ?</Label>
                  <RadioGroup options={['Oui', 'Non']} value={form.accoucheApresCesarienne ? 'Oui' : form.accoucheApresCesarienne === false ? 'Non' : ''} onChange={v => up('accoucheApresCesarienne', v === 'Oui')} />
                </div>
              </>
            )}
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">10. (bis) Êtes vous inscrite en consultation prénatale (CPN) ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.inscriteCpn ? 'Oui' : form.inscriteCpn === false ? 'Non' : ''} onChange={v => up('inscriteCpn', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">11. À quel mois de la grossesse avez vous commencé les consultations prénatales ?</Label>
            <RadioGroup options={['1er trimestre', '2ème trimestre', '3ème trimestre']} value={form.moisDebutCpn || ''} onChange={v => up('moisDebutCpn', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">12. Combien de consultations prénatales avez-vous déjà effectuées</Label>
            <RadioGroup options={['1–2', '3–4', 'Plus de 4', 'Aucun']} value={form.nbConsultations || ''} onChange={v => up('nbConsultations', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">13. Qui assure le suivi de votre grossesse ?</Label>
            <RadioGroup options={SUIVIS} value={form.suivi || ''} onChange={v => up('suivi', v)} other={form.autreSuivi} onOther={v => up('autreSuivi', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">14. Lors des consultations prénatales, la tension artérielle est-elle mesurée?</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.taMesuree || ''} onChange={v => up('taMesuree', v)} />
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">15. Avez vous déjà entendu parler de l'hypertension artérielle pendant la grossesse</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.entenduHtaGrossesse ? 'Oui' : form.entenduHtaGrossesse === false ? 'Non' : ''} onChange={v => up('entenduHtaGrossesse', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">16. Savez-vous que l'hypertension peut être dangereuse pour la mère et le bébé ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.dangerHtaMereBebe ? 'Oui' : form.dangerHtaMereBebe === false ? 'Non' : ''} onChange={v => up('dangerHtaMereBebe', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">17. Connaissez-vous la prééclampsie ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.connaissancePreeclampsie ? 'Oui' : form.connaissancePreeclampsie === false ? 'Non' : ''} onChange={v => up('connaissancePreeclampsie', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">18. Par qui avez-vous entendu parler de la prééclampsie ?</Label>
            <RadioGroup options={SOURCES_INFO} value={form.sourceInfoPreeclampsie || ''} onChange={v => up('sourceInfoPreeclampsie', v)} other={form.autreSource} onOther={v => up('autreSource', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">19. Quels signes peuvent alerter une femme enceinte ?</Label>
            <CheckboxGroup options={SIGNES_ALERTE_PATIENTE} selected={form.signesAlerte || []} onChange={v => up('signesAlerte', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">20. La sage-femme vous explique-t-elle les signes de danger pendant la grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.sfExpliqueSgnsDanger ? 'Oui' : form.sfExpliqueSgnsDanger === false ? 'Non' : ''} onChange={v => up('sfExpliqueSgnsDanger', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">21. Vous donne-t-elle des conseils pour prévenir les complications de la grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.conseilsPrevention ? 'Oui' : form.conseilsPrevention === false ? 'Non' : ''} onChange={v => up('conseilsPrevention', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">22. Vous conseille-t-elle de revenir rapidement en cas de symptômes inhabituels ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.conseilleRevenirRapidement ? 'Oui' : form.conseilleRevenirRapidement === false ? 'Non' : ''} onChange={v => up('conseilleRevenirRapidement', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">23. Êtes-vous satisfaite de la surveillance faite par la sage-femme pendant votre grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.satisfactionSuivi ? 'Oui' : form.satisfactionSuivi === false ? 'Non' : ''} onChange={v => up('satisfactionSuivi', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Que suggérez-vous pour améliorer les soins à l’endroit des femmes avec hypertension et /ou éclampsie ?</Label>
            <CheckboxGroup options={SUGGESTIONS_PATIENTE} selected={form.suggestions || []} onChange={v => up('suggestions', v)} />
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => { if (section > 0) { setSection(s => s - 1); } else { setMode(null); } }} className="gap-1 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="outline" className="text-xs">{mode === 'patient' ? 'Mode Patient' : 'Mode Registre'}</Badge>
            <span className="text-xs text-muted-foreground">Section {section + 1} / {SECTIONS.length}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} className="h-full bg-primary rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
        {SECTIONS.map((s, i) => (
          <button 
            key={s.id} 
            onClick={() => { setDirection(i > section ? 1 : -1); setSection(i); }} 
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all btn-active-scale ${i === section ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : i < section ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}
          >
            {i < section ? '✓' : s.icon} {s.titre}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div 
          key={section}
          custom={direction}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="border-border shadow-sm mb-24">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">{SECTIONS[section].icon}</span> 
                <span className="truncate">{SECTIONS[section].titre}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-6">{renderSection()}</CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 lg:bottom-0 p-4 pb-[calc(var(--safe-area-bottom)+80px)] lg:pb-6 glass border-t border-border/50 z-20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button variant="outline" size="lg" onClick={() => handleSave('brouillon')} disabled={loading} className="gap-2 flex-1 sm:flex-none h-12 rounded-xl text-xs font-bold">
            <Save className="w-4 h-4" /> {loading ? '...' : 'Brouillon'}
          </Button>
          <div className="flex-1 hidden sm:block" />
          {!isLast ? (
            <Button onClick={() => { setDirection(1); setSection(s => s + 1); }} size="lg" className="gap-2 flex-1 sm:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-bold">
              Suivant <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => handleSave('complet')} disabled={loading} size="lg" className="gap-2 flex-1 sm:flex-none h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 text-xs font-bold">
              <CheckCircle className="w-4 h-4" /> {loading ? 'Envoi...' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
