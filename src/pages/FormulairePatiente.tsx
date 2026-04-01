import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Save, CheckCircle, AlertTriangle, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePatientesData, useAuth } from '@/hooks/useData';
import { useNotifications } from '@/hooks/useNotifications';
import { generateId, detectAlertePatiente, ROUTE_PATHS, AGES_PATIENTE, SITUATIONS_MATRIMONIALES, NIVEAUX_INSTRUCTION, PROFESSIONS, NB_GROSSESSES, NB_CONSULTATIONS, SIGNES_ALERTE_PATIENTE, SUGGESTIONS_PATIENTE, SUIVIS, SOURCES_INFO, CENTRES } from '@/lib/index';
import type { ReponsePatiente, FormMode } from '@/lib/index';

const SECTIONS = [
  { id: 1, titre: 'Informations socio-démographiques', icon: '👩' },
  { id: 2, titre: 'Antécédents obstétricaux', icon: '🤰' },
  { id: 3, titre: 'Suivi prénatal', icon: '🩺' },
  { id: 4, titre: 'Connaissances & sensibilisation', icon: '💡' },
];

function RadioGroup({ options, value, onChange, other, onOther }: {
  options: string[]; value: string; onChange: (v: string) => void;
  other?: string; onOther?: (v: string) => void;
}) {
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
      {onOther && <Input placeholder="Autre (précisez)" value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm mt-2" />}
    </div>
  );
}

function CheckboxGroup({ options, selected, onChange, other, onOther }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  other?: string; onOther?: (v: string) => void;
}) {
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
      {onOther && <Input placeholder="Autre" value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm mt-2" />}
    </div>
  );
}

const emptyForm = (): Partial<ReponsePatiente> => ({
  nomPatiente: '', prenomPatiente: '', telephonePatiente: '',
  age: '', situationMatrimoniale: '', niveauInstruction: '',
  profession: '', autreProfession: '', lieuResidence: '',
  nbGrossesses: '', nbEnfantsVivants: '', fauxCouche: false, atcdHtaPreeclampsie: false,
  inscriteCpn: false, moisDebutCpn: '', nbConsultations: '', suivi: '', autreSuivi: '', taMesuree: '',
  entenduHtaGrossesse: false, dangerHtaMereBebe: false, connaissancePreeclampsie: false,
  sourceInfoPreeclampsie: '', autreSource: '', signesAlerte: [],
  sfExpliqueSgnsDanger: false, lesquelsSgnsDanger: '',
  conseilsPrevention: false, lesquelsConseils: '',
  satisfactionSuivi: false, suggestions: [], autreSuggestions: '',
});

export default function FormulairePatiente() {
  const [mode, setMode] = useState<FormMode | null>(null);
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<Partial<ReponsePatiente>>(emptyForm());
  const [centre, setCentre] = useState('');
  const [customCentre, setCustomCentre] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerteDetectee, setAlerteDetectee] = useState(false);
  const [direction, setDirection] = useState(0); // 1 pour droit, -1 pour gauche
  const { save } = usePatientesData();
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const navigate = useNavigate();

  const up = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async (statut: 'complet' | 'brouillon') => {
    setLoading(true);
    try {
      const alerte = detectAlertePatiente(form);
      const r: ReponsePatiente = {
        id: generateId(), date: new Date().toISOString(),
        sageFemme: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        centre: (centre === 'Autre' ? customCentre : centre) || user?.centre || '',
        ...(form as ReponsePatiente), statut, alerte,
      };
      await save(r);
      toast.success(statut === 'complet' ? 'Enquête patiente enregistrée' : 'Brouillon sauvegardé');
      if (alerte) { 
        setAlerteDetectee(true);
        sendNotification('⚠️ ALERTE PRÉÉCLAMPSIE', `Une patiente à risque a été détectée à ${centre || user?.centre}.`);
      } else { 
        setSaved(true); 
      }
      setTimeout(() => navigate(ROUTE_PATHS.HISTORIQUE), alerte ? 3500 : 1500);
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
          <h1 className="text-2xl font-bold mb-1">Enquête Patiente</h1>
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

  if (alerteDetectee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
          <div className="w-20 h-20 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-destructive text-center">⚠️ Alerte Prééclampsie Suspectée</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-sm">Cette patiente présente des signes évocateurs de prééclampsie. Un suivi médical urgent est recommandé.</p>
        <p className="text-xs text-muted-foreground mt-3">Données enregistrées. Redirection…</p>
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
          <div className="space-y-2">
            <Label>1. Âge</Label>
            <RadioGroup options={AGES_PATIENTE} value={form.age || ''} onChange={v => up('age', v)} />
          </div>
          <div className="space-y-2">
            <Label>2. Situation matrimoniale</Label>
            <RadioGroup options={SITUATIONS_MATRIMONIALES} value={form.situationMatrimoniale || ''} onChange={v => up('situationMatrimoniale', v)} />
          </div>
          <div className="space-y-2">
            <Label>3. Niveau d'instruction</Label>
            <RadioGroup options={NIVEAUX_INSTRUCTION} value={form.niveauInstruction || ''} onChange={v => up('niveauInstruction', v)} />
          </div>
          <div className="space-y-2">
            <Label>4. Profession</Label>
            <RadioGroup options={PROFESSIONS} value={form.profession || ''} onChange={v => up('profession', v)} other={form.autreProfession} onOther={v => up('autreProfession', v)} />
          </div>
          <div className="space-y-2">
            <Label>5. Lieu de résidence</Label>
            <RadioGroup options={['Urbain', 'Rural']} value={form.lieuResidence || ''} onChange={v => up('lieuResidence', v)} />
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>6. Nombre de grossesses</Label>
            <RadioGroup options={NB_GROSSESSES} value={form.nbGrossesses || ''} onChange={v => up('nbGrossesses', v)} />
          </div>
          <div className="space-y-2">
            <Label>7. Enfants vivants</Label>
            <RadioGroup options={['0', '1 - 2', '3 et plus']} value={form.nbEnfantsVivants || ''} onChange={v => up('nbEnfantsVivants', v)} />
          </div>
          <div className="space-y-2">
            <Label>8. Déjà fait une fausse couche ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.fauxCouche ? 'Oui' : form.fauxCouche === false ? 'Non' : ''} onChange={v => up('fauxCouche', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>9. ATCD d'HTA prééclamptique lors d'une grossesse précédente ?</Label>
            {form.atcdHtaPreeclampsie && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3" /> Facteur de risque identifié
              </div>
            )}
            <RadioGroup options={['Oui', 'Non']} value={form.atcdHtaPreeclampsie ? 'Oui' : form.atcdHtaPreeclampsie === false ? 'Non' : ''} onChange={v => up('atcdHtaPreeclampsie', v === 'Oui')} />
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>10. Inscrite en consultation prénatale (CPN) ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.inscriteCpn ? 'Oui' : form.inscriteCpn === false ? 'Non' : ''} onChange={v => up('inscriteCpn', v === 'Oui')} />
          </div>
          {form.inscriteCpn && (
            <>
              <div className="space-y-2">
                <Label>11. Mois de début des CPN</Label>
                <RadioGroup options={['1er trimestre', '2ème trimestre', '3ème trimestre']} value={form.moisDebutCpn || ''} onChange={v => up('moisDebutCpn', v)} />
              </div>
              <div className="space-y-2">
                <Label>12. Nombre de consultations effectuées</Label>
                <RadioGroup options={NB_CONSULTATIONS} value={form.nbConsultations || ''} onChange={v => up('nbConsultations', v)} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>13. Qui assure le suivi de la grossesse ?</Label>
            <RadioGroup options={SUIVIS} value={form.suivi || ''} onChange={v => up('suivi', v)} other={form.autreSuivi} onOther={v => up('autreSuivi', v)} />
          </div>
          <div className="space-y-2">
            <Label>14. La TA est-elle mesurée lors des CPN ?</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.taMesuree || ''} onChange={v => up('taMesuree', v)} />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>15. Déjà entendu parler de l'HTA pendant la grossesse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.entenduHtaGrossesse ? 'Oui' : form.entenduHtaGrossesse === false ? 'Non' : ''} onChange={v => up('entenduHtaGrossesse', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>16. Sait que l'HTA peut être dangereuse ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.dangerHtaMereBebe ? 'Oui' : form.dangerHtaMereBebe === false ? 'Non' : ''} onChange={v => up('dangerHtaMereBebe', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>17. Connaît la prééclampsie ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.connaissancePreeclampsie ? 'Oui' : form.connaissancePreeclampsie === false ? 'Non' : ''} onChange={v => up('connaissancePreeclampsie', v === 'Oui')} />
          </div>
          {form.connaissancePreeclampsie && (
            <div className="space-y-2">
              <Label>18. Par qui a-t-elle entendu parler de la prééclampsie ?</Label>
              <RadioGroup options={SOURCES_INFO} value={form.sourceInfoPreeclampsie || ''} onChange={v => up('sourceInfoPreeclampsie', v)} other={form.autreSource} onOther={v => up('autreSource', v)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>19. Signes pouvant alerter une femme enceinte :</Label>
            <CheckboxGroup options={SIGNES_ALERTE_PATIENTE} selected={form.signesAlerte || []} onChange={v => up('signesAlerte', v)} />
          </div>
          <div className="space-y-2">
            <Label>20. La SF explique-t-elle les signes de danger ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.sfExpliqueSgnsDanger ? 'Oui' : form.sfExpliqueSgnsDanger === false ? 'Non' : ''} onChange={v => up('sfExpliqueSgnsDanger', v === 'Oui')} />
            {form.sfExpliqueSgnsDanger && <Textarea placeholder="Lesquels ?" value={form.lesquelsSgnsDanger || ''} onChange={e => up('lesquelsSgnsDanger', e.target.value)} className="min-h-16 resize-none mt-2" />}
          </div>
          <div className="space-y-2">
            <Label>21. Donne-t-elle des conseils de prévention ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.conseilsPrevention ? 'Oui' : form.conseilsPrevention === false ? 'Non' : ''} onChange={v => up('conseilsPrevention', v === 'Oui')} />
            {form.conseilsPrevention && <Textarea placeholder="Lesquels ?" value={form.lesquelsConseils || ''} onChange={e => up('lesquelsConseils', e.target.value)} className="min-h-16 resize-none mt-2" />}
          </div>
          <div className="space-y-2">
            <Label>23. Satisfaite de la surveillance par la sage-femme ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.satisfactionSuivi ? 'Oui' : form.satisfactionSuivi === false ? 'Non' : ''} onChange={v => up('satisfactionSuivi', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label>24. Suggestions pour améliorer les soins :</Label>
            <CheckboxGroup options={SUGGESTIONS_PATIENTE} selected={form.suggestions || []} onChange={v => up('suggestions', v)} other={form.autreSuggestions} onOther={v => up('autreSuggestions', v)} />
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

      {/* Sticky Bottom Actions */}
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
