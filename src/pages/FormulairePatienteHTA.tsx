import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Save, CheckCircle, AlertTriangle, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePatientesHTAData, useAuth } from '@/hooks/useData';
import { generateId, ROUTE_PATHS, CENTRES, Q4_MESURE_TA, Q12_EVALUE_SUIVI, Q14_MESURE_TA_CHAQUE_CONSULT, Q15_IMPORTANCE_BANDELETTE, Q17_INSISTE_BANDELETTE, Q19_POURQUOI_BANDELETTE, Q23_ACTION_SF, Q25_EXAMENS_DEMANDES, Q26_SIGNES_INHABITUELS } from '@/lib/index';
import type { ReponsePatienteHTA, FormMode } from '@/lib/index';

const SECTIONS = [
  { id: 1, titre: 'Informations générales', icon: '👩' },
  { id: 2, titre: 'Évaluation du suivi (1-10)', icon: '🩺' },
  { id: 3, titre: 'Prise en charge (11-20)', icon: '💡' },
  { id: 4, titre: 'Complications (21-26)', icon: '🚨' },
];

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label 
          key={opt} 
          onClick={() => onChange(opt)}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${value === opt ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/50'}`}
        >
          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${value === opt ? 'border-primary' : 'border-muted-foreground/40'}`}>
            {value === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-sm text-foreground">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; }) {
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label 
          key={opt} 
          onClick={() => toggle(opt)}
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${selected.includes(opt) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/50'}`}
        >
          <div className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${selected.includes(opt) ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
            {selected.includes(opt) && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
          </div>
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}

const emptyForm = (): Partial<ReponsePatienteHTA> => ({
  nomPatiente: '', prenomPatiente: '', telephonePatiente: '',
  q1RoleSf: '', q2TensionElevee: '', q3RisqueComplication: '',
  q4MesureTa: '', q5NoteResultats: '', q6RdvRapproches: '',
  q7RevenirRapidement: '', q8ExpliqueEtat: '', q9BienSuivie: '',
  q10Ecoute: '', q11Confiance: '', q12EvalueSuivi: '',
  q13RoleSfHta: '', q14MesureTaChaqueConsult: '', q15ImportanceBandelette: '',
  q16BandeletteDetecteComplication: '', q17InsisteBandelette: '', q18SaitPourquoiBandelette: '',
  q19PourquoiBandelette: [], q20ComprendExplications: '', q21PoseQuestions: '',
  q22TensionEleveeGrossesse: '', q23ActionSf: '', q24RegulierementSuivie: '',
  q25ExamensDemandes: '', q26SignesInhabituels: [],
});

export default function FormulairePatienteHTA() {
  const [mode, setMode] = useState<FormMode | null>(null);
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<Partial<ReponsePatienteHTA>>(emptyForm());
  const [centre, setCentre] = useState('');
  const [customCentre, setCustomCentre] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0); 
  const { save } = usePatientesHTAData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const up = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async (statut: 'complet' | 'brouillon') => {
    setLoading(true);
    try {
      const r: ReponsePatienteHTA = {
        id: generateId(), date: new Date().toISOString(),
        sageFemme: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        centre: (centre === 'Autre' ? customCentre : centre) || user?.centre || '',
        ...(form as ReponsePatienteHTA), statut, alerte: false,
      };
      await save(r);
      toast.success(statut === 'complet' ? 'Évaluation enregistrée' : 'Brouillon sauvegardé');
      setSaved(true); 
      setTimeout(() => navigate(ROUTE_PATHS.HISTORIQUE), 1500);
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(`Erreur lors de l'enregistrement : ${err.message || 'Problème de connexion'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTE_PATHS.DASHBOARD)} className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <h1 className="text-2xl font-bold mb-1">Évaluation du Suivi (Femmes Hypertendues)</h1>
          <p className="text-muted-foreground mb-6 text-sm">Choisissez le mode de saisie</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { m: 'patient' as FormMode, icon: <User className="w-7 h-7 text-primary" />, titre: 'Mode Patient', desc: 'En présence de la patiente. Guidé et progressif.', badge: 'Recommandé', badgeClass: 'bg-primary/10 text-primary border-primary/20' },
              { m: 'registre' as FormMode, icon: <Zap className="w-7 h-7 text-accent-foreground" />, titre: 'Mode Registre', desc: 'Depuis le dossier patient. Saisie rapide.', badge: 'Saisie accélérée', badgeClass: '' },
            ].map(({ m, icon, titre, desc, badge, badgeClass }) => (
              <motion.div key={m} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                <Card onClick={() => setMode(m)} className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${m === 'patient' ? 'bg-primary/10' : 'bg-accent/20'}`}>{icon}</div>
                    <h3 className="font-bold text-lg">{titre}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <Badge className={`text-xs ${badgeClass}`}>{badge}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
        <h2 className="text-2xl font-bold">Enquête enregistrée !</h2>
        <p className="text-muted-foreground mt-1">Redirection vers l'historique…</p>
      </div>
    );
  }

  const isLast = section === SECTIONS.length - 1;
  const progress = ((section + 1) / SECTIONS.length) * 100;

  const renderSection = () => {
    switch (section) {
      case 0: return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de la patiente</Label>
              <Input placeholder="Nom" value={form.nomPatiente || ''} onChange={e => up('nomPatiente', e.target.value)} className="h-11 border-2" />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input placeholder="Prénom" value={form.prenomPatiente || ''} onChange={e => up('prenomPatiente', e.target.value)} className="h-11 border-2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Numéro de téléphone / Patient</Label>
            <Input placeholder="01 02 03 04 05" value={form.telephonePatiente || ''} onChange={e => up('telephonePatiente', e.target.value)} className="h-11 border-2" />
          </div>
          <div className="space-y-2">
            <Label>Centre / Structure</Label>
            <select value={centre} onChange={e => setCentre(e.target.value)} className="w-full h-11 border-2 border-input rounded-lg px-3 text-sm bg-background focus:border-primary outline-none">
              <option value="">Sélectionner…</option>
              {CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {centre === 'Autre' && (
              <Input placeholder="Nom de votre centre de santé" value={customCentre} onChange={e => setCustomCentre(e.target.value)} className="h-11 border-2 mt-2" />
            )}
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>1- Pensez vous que la sage femme joue un rôle important dans la prévention de l'hypertension artérielle</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q1RoleSf || ''} onChange={v => up('q1RoleSf', v)} />
          </div>
          <div className="space-y-2">
            <Label>2- La sage femme vous a-t-elle déjà dit que vous avez une tension élevée ?</Label>
            <RadioGroup options={['Oui', 'Non', 'Je ne sais pas']} value={form.q2TensionElevee || ''} onChange={v => up('q2TensionElevee', v)} />
          </div>
          <div className="space-y-2">
            <Label>3- Vous a-t-elle expliqué que vous êtes à risque de complications comme la prééclampsie ?</Label>
            <RadioGroup options={['Oui clairement', 'Non']} value={form.q3RisqueComplication || ''} onChange={v => up('q3RisqueComplication', v)} />
          </div>
          <div className="space-y-2">
            <Label>4- Depuis que votre tension est élevée, la mesure de la tension artérielle est faite:</Label>
            <RadioGroup options={Q4_MESURE_TA} value={form.q4MesureTa || ''} onChange={v => up('q4MesureTa', v)} />
          </div>
          <div className="space-y-2">
            <Label>5- La Sage femme note-t-elle vos résultats dans votre carnet ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q5NoteResultats || ''} onChange={v => up('q5NoteResultats', v)} />
          </div>
          <div className="space-y-2">
            <Label>6- Avez-vous eu des rendez-vous rapprochés à cause de votre tension ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q6RdvRapproches || ''} onChange={v => up('q6RdvRapproches', v)} />
          </div>
          <div className="space-y-2">
            <Label>7- La Sage femme vous demande-t-elle de revenir rapidement en cas de problème ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q7RevenirRapidement || ''} onChange={v => up('q7RevenirRapidement', v)} />
          </div>
          <div className="space-y-2">
            <Label>8- La sage femme vous explique t-elle claire ment votre etat de santé ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q8ExpliqueEtat || ''} onChange={v => up('q8ExpliqueEtat', v)} />
          </div>
          <div className="space-y-2">
            <Label>9- Vous sentez vous bien qsuivie par la Sage femme?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q9BienSuivie || ''} onChange={v => up('q9BienSuivie', v)} />
          </div>
          <div className="space-y-2">
            <Label>10- Prend elle le temps de vous ecouter?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q10Ecoute || ''} onChange={v => up('q10Ecoute', v)} />
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>11- Vous met-elle en confiance?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q11Confiance || ''} onChange={v => up('q11Confiance', v)} />
          </div>
          <div className="space-y-2">
            <Label>12- Comment evaluez vous globalement le suivi de votre grossesse ?</Label>
            <RadioGroup options={Q12_EVALUE_SUIVI} value={form.q12EvalueSuivi || ''} onChange={v => up('q12EvalueSuivi', v)} />
          </div>
          <div className="space-y-2">
            <Label>13- Selon vous la Sage femme joue t-elle un rôle important dans la prévention des complications liées à l'hypertension artérielle?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.q13RoleSfHta || ''} onChange={v => up('q13RoleSfHta', v)} />
          </div>
          <div className="space-y-2">
            <Label>14- La sage femme mesure t-elle votre tension arterielle à chaque consultation</Label>
            <RadioGroup options={Q14_MESURE_TA_CHAQUE_CONSULT} value={form.q14MesureTaChaqueConsult || ''} onChange={v => up('q14MesureTaChaqueConsult', v)} />
          </div>
          <div className="space-y-2">
            <Label>15- Insiste-t-elle pour l'importance de la bandelette urinaire?</Label>
            <RadioGroup options={Q15_IMPORTANCE_BANDELETTE} value={form.q15ImportanceBandelette || ''} onChange={v => up('q15ImportanceBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>16- Vous a-t-elle dit que cet examen permet de detecter les complications comme la prééclampsie?</Label>
            <RadioGroup options={['oui', 'Non', 'Je ne sais pas']} value={form.q16BandeletteDetecteComplication || ''} onChange={v => up('q16BandeletteDetecteComplication', v)} />
          </div>
          <div className="space-y-2">
            <Label>17- La sage femme insiste t-elle pour que vous fassiez la bandelette urinaire à chaque consultation ?</Label>
            <RadioGroup options={Q17_INSISTE_BANDELETTE} value={form.q17InsisteBandelette || ''} onChange={v => up('q17InsisteBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>18- Saviez vous pourquoi on fait la bandelette urinaire?</Label>
            <RadioGroup options={['oui', 'Non']} value={form.q18SaitPourquoiBandelette || ''} onChange={v => up('q18SaitPourquoiBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>19- Si oui, pourquoi ?</Label>
            <CheckboxGroup options={Q19_POURQUOI_BANDELETTE} selected={form.q19PourquoiBandelette || []} onChange={v => up('q19PourquoiBandelette', v)} />
          </div>
          <div className="space-y-2">
            <Label>20- Comprenez vous facilement les explications des sages femmes?</Label>
            <RadioGroup options={['Non', 'oui']} value={form.q20ComprendExplications || ''} onChange={v => up('q20ComprendExplications', v)} />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>21- Avez vous la possibilité de poser des questions?</Label>
            <RadioGroup options={['oui', 'Non']} value={form.q21PoseQuestions || ''} onChange={v => up('q21PoseQuestions', v)} />
          </div>
          <div className="space-y-2">
            <Label>22- Avez vous deja fait une tension elevee pendant cette grossesse?</Label>
            <RadioGroup options={['oui', 'Non', 'Je ne sais pas']} value={form.q22TensionEleveeGrossesse || ''} onChange={v => up('q22TensionEleveeGrossesse', v)} />
          </div>
          <div className="space-y-2">
            <Label>23- Si oui, qu'a fait la Sage femme?</Label>
            <RadioGroup options={Q23_ACTION_SF} value={form.q23ActionSf || ''} onChange={v => up('q23ActionSf', v)} />
          </div>
          <div className="space-y-2">
            <Label>24- Êtes vous régulièrement suivie apres un problème?</Label>
            <RadioGroup options={['oui', 'Non']} value={form.q24RegulierementSuivie || ''} onChange={v => up('q24RegulierementSuivie', v)} />
          </div>
          <div className="space-y-2">
            <Label>25- Faites vous les examens demandés?</Label>
            <RadioGroup options={Q25_EXAMENS_DEMANDES} value={form.q25ExamensDemandes || ''} onChange={v => up('q25ExamensDemandes', v)} />
          </div>
          <div className="space-y-2">
            <Label>26- En cas de signes inhabituels (maux de tête, oedemes, vision floue...), que faites vous?</Label>
            <CheckboxGroup options={Q26_SIGNES_INHABITUELS} selected={form.q26SignesInhabituels || []} onChange={v => up('q26SignesInhabituels', v)} />
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => { if (section > 0) setSection(s => s - 1); else setMode(null); }} className="gap-1 text-muted-foreground">
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
            onClick={() => {
              setDirection(i > section ? 1 : -1);
              setSection(i);
            }} 
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
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => handleSave('brouillon')} 
            disabled={loading} 
            className="gap-2 flex-1 sm:flex-none h-12 rounded-xl text-xs font-bold"
          >
            <Save className="w-4 h-4" /> {loading ? '...' : 'Brouillon'}
          </Button>
          <div className="flex-1 hidden sm:block" />
          {!isLast ? (
            <Button 
              onClick={() => { setDirection(1); setSection(s => s + 1); }} 
              size="lg"
              className="gap-2 flex-1 sm:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-bold"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={() => handleSave('complet')} 
              disabled={loading} 
              size="lg"
              className="gap-2 flex-1 sm:flex-none h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 text-xs font-bold"
            >
              <CheckCircle className="w-4 h-4" /> {loading ? 'Envoi...' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
