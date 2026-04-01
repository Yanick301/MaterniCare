import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertTriangle, Zap, User, ArrowLeft, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSFEData, useAuth, createSharedLink } from '@/hooks/useData';
import { generateId, detectAlertePatiente, ROUTE_PATHS, EXPERIENCES, FACTEURS_RISQUE, SIGNES_CLINIQUES, FREQ_CONTROLE_TA, ELEMENTS_HYPERTENDUE, CONDUITE_HTA, ANTIHYPERTENSIFS, CONSEILS_HYPERTENSION, PROPORTIONS_GUERISON, FEMMES_RISQUE, CENTRES } from '@/lib/index';
import type { ReponseSFE, FormMode } from '@/lib/index';

const SECTIONS = [
  { id: 1, titre: 'Données sociodémographiques', icon: '👤' },
  { id: 2, titre: 'Connaissances médicales', icon: '🧠' },
  { id: 3, titre: 'Pratiques professionnelles', icon: '🩺' },
  { id: 4, titre: 'Évolution & pronostic', icon: '📈' },
];

function CheckboxGroup({ options, selected, onChange, other, onOther, otherLabel = 'Autre' }: {
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
      {onOther && (
        <div className="mt-2">
          <Input placeholder={`${otherLabel} (précisez)`} value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm" />
        </div>
      )}
    </div>
  );
}

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
          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${value === opt ? 'border-primary' : 'border-muted-foreground/40'}`}>
            {value === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-sm text-foreground">{opt}</span>
        </label>
      ))}
      {onOther && (
        <Input placeholder="Autre (précisez)" value={other || ''} onChange={e => onOther(e.target.value)} className="h-9 text-sm mt-2" />
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
  casReference: '', conseilsHypertendue: [], difficultesHta: false,
  detailsDifficultes: '', ameliorationsProposees: '',
  collaborationRelais: false, commentCollaboration: '',
  contreRefRenvoyees: false, pourquoiNonContreRef: '',
  proportionGuerison: '', autreProportionGuerison: '',
  femmesRisqueComplications: [],
});

export default function FormulaireSFE() {
  const [mode, setMode] = useState<FormMode | null>(null);
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<Partial<ReponseSFE>>(emptyForm());
  const [centre, setCentre] = useState('');
  const [customCentre, setCustomCentre] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [direction, setDirection] = useState(0);
  const { save } = useSFEData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const up = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async (statut: 'complet' | 'brouillon') => {
    setLoading(true);
    try {
      const r: ReponseSFE = {
        id: generateId(),
        date: new Date().toISOString(),
        sageFemme: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
        centre: (centre === 'Autre' ? customCentre : centre) || user?.centre || '',
        ...(form as ReponseSFE),
        statut,
        alerte: false,
      };
      await save(r);
      toast.success('Enquête enregistrée avec succès');
      setSaved(true);
      setTimeout(() => navigate(ROUTE_PATHS.HISTORIQUE), 1500);
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(`Erreur lors de l'enregistrement : ${err.message || 'Problème de connexion'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareId = generateId();
    try {
      await createSharedLink({
        id: shareId,
        senderName: `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Sage-femme',
        senderEmail: user?.email || '',
        centre: (centre === 'Autre' ? customCentre : centre) || user?.centre || '',
        formType: 'sfe',
      });
      const baseUrl = window.location.origin + window.location.pathname;
      const link = `${baseUrl}#/questionnaire/sfe/${shareId}`;
      setShareLink(link);
      navigator.clipboard.writeText(link).then(() => {
        toast.success('Lien copié dans le presse-papiers !');
      }).catch(() => {
        toast.success('Lien généré — copiez-le ci-dessous');
      });
    } catch (err: any) {
      toast.error(`Erreur lors de la création du lien : ${err.message || 'Problème de connexion'}`);
    }
  };

  if (!mode) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTE_PATHS.DASHBOARD)} className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <h1 className="text-2xl font-bold text-foreground mb-1">Enquête Sage-Femme</h1>
          <p className="text-muted-foreground mb-6 text-sm">Choisissez le mode de saisie</p>

          {/* Bouton Partager */}
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Partager le questionnaire</p>
                <p className="text-xs text-muted-foreground">Générez un lien à envoyer à une sage-femme</p>
              </div>
              <Button size="sm" onClick={handleShare} className="gap-2 shrink-0">
                <Share2 className="w-3 h-3" /> Partager
              </Button>
            </div>
            {shareLink && (
              <div className="mt-3 flex items-center gap-2 bg-white rounded-lg p-2 border border-primary/10">
                <Input value={shareLink} readOnly className="h-8 text-xs bg-transparent border-none" />
                <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Lien copié !'); }}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card onClick={() => setMode('patient')} className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">Mode Patient</h3>
                  <p className="text-sm text-muted-foreground">Remplissage en présence de la sage-femme. Interface guidée, étape par étape.</p>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Recommandé</Badge>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card onClick={() => setMode('registre')} className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Zap className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">Mode Registre</h3>
                  <p className="text-sm text-muted-foreground">Saisie rapide depuis le registre. Formulaire compact, accès direct à tous les champs.</p>
                  <Badge variant="outline" className="text-xs">Saisie accélérée</Badge>
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
        <h2 className="text-2xl font-bold text-foreground">Enquête enregistrée !</h2>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Âge (années révolues)</Label>
              <Input type="number" placeholder="Ex: 35" value={form.age ?? ''} onChange={e => up('age', parseInt(e.target.value) || null)} className="h-11 text-lg" min={18} max={70} />
            </div>
            <div className="space-y-2">
              <Label>Centre / Structure</Label>
              <select value={centre} onChange={e => setCentre(e.target.value)} className="w-full h-11 border-2 border-input rounded-lg px-3 text-sm bg-background focus:border-primary outline-none transition-colors">
                <option value="">Sélectionner…</option>
                {CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {centre === 'Autre' && (
                <Input placeholder="Nom de votre centre de santé" value={customCentre} onChange={e => setCustomCentre(e.target.value)} className="h-11 border-2 mt-2" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Années d'expérience professionnelle</Label>
            <RadioGroup options={EXPERIENCES} value={form.experiencePro || ''} onChange={v => up('experiencePro', v)} />
          </div>
          <div className="space-y-3">
            <Label>Formation sur la prise en charge HTA / Prééclampsie (SONU) ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.formationHta ? 'Oui' : form.formationHta === false ? 'Non' : ''} onChange={v => up('formationHta', v === 'Oui')} />
            {form.formationHta && (
              <div className="space-y-1 mt-2">
                <Label className="text-sm">Si oui, en quelle année ?</Label>
                <Input placeholder="Année (ex: 2023)" value={form.anneeFormation || ''} onChange={e => up('anneeFormation', e.target.value)} className="h-10 max-w-xs" maxLength={4} />
              </div>
            )}
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">4. L'HTA pendant la grossesse se définit par :</Label>
            <RadioGroup options={['TA ≥140/90 mmHg']} value={form.defHta || ''} onChange={v => up('defHta', v)} other={form.autreDefHta} onOther={v => up('autreDefHta', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">5. La prééclampsie est caractérisée par :</Label>
            <RadioGroup options={['HTA + protéinurie']} value={form.caracPreeclampsie || ''} onChange={v => up('caracPreeclampsie', v)} other={form.autreCaracPreeclampsie} onOther={v => up('autreCaracPreeclampsie', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">6. Âge gestationnel d'apparition de la prééclampsie :</Label>
            <RadioGroup options={['Après 20 semaines d\'aménorrhée']} value={form.ageGestationnel || ''} onChange={v => up('ageGestationnel', v)} other={form.autreAgeGestationnel} onOther={v => up('autreAgeGestationnel', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">7. Principaux facteurs de risque de la prééclampsie :</Label>
            <CheckboxGroup options={FACTEURS_RISQUE} selected={form.factRisque || []} onChange={v => up('factRisque', v)} other={form.autreFactRisque} onOther={v => up('autreFactRisque', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">8. Signes cliniques évocateurs de prééclampsie :</Label>
            <CheckboxGroup options={SIGNES_CLINIQUES} selected={form.signesCliniques || []} onChange={v => up('signesCliniques', v)} other={form.autreSignesCliniques} onOther={v => up('autreSignesCliniques', v)} />
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">9. Fréquence de contrôle de la TA :</Label>
            <RadioGroup options={FREQ_CONTROLE_TA} value={form.freqControleTA || ''} onChange={v => up('freqControleTA', v)} other={form.autreFreqControleTA} onOther={v => up('autreFreqControleTA', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">10. Mesure systématique de la TA :</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.mesureSystematiqueTA || ''} onChange={v => up('mesureSystematiqueTA', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">11. Recherche de la protéinurie dans le bilan prénatal :</Label>
            <RadioGroup options={['Toujours', 'Parfois', 'Jamais']} value={form.recherchProteinurie || ''} onChange={v => up('recherchProteinurie', v)} other={form.autreRecherchProteinurie} onOther={v => up('autreRecherchProteinurie', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">12. Surveillance des mouvements fœtaux ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.surveillanceMvtFoetaux ? 'Oui' : form.surveillanceMvtFoetaux === false ? 'Non' : ''} onChange={v => up('surveillanceMvtFoetaux', v === 'Oui')} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">13. Éléments à rechercher chez une femme hypertendue :</Label>
            <CheckboxGroup options={ELEMENTS_HYPERTENDUE} selected={form.elementsHypertendue || []} onChange={v => up('elementsHypertendue', v)} other={form.autreElementsHypertendue} onOther={v => up('autreElementsHypertendue', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">14. Conduite à tenir en cas d'HTA :</Label>
            <CheckboxGroup options={CONDUITE_HTA} selected={form.conduiteHtaGrossesse || []} onChange={v => up('conduiteHtaGrossesse', v)} other={form.autreConduiteHta} onOther={v => up('autreConduiteHta', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">15. Antihypertensifs utilisables pendant la grossesse :</Label>
            <CheckboxGroup options={ANTIHYPERTENSIFS} selected={form.antihypertensifs || []} onChange={v => up('antihypertensifs', v)} other={form.autreAntihypertensifs} onOther={v => up('autreAntihypertensifs', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">16. Dans quel cas décidez-vous de référer une patiente ?</Label>
            <Textarea placeholder="Décrivez les critères de référence…" value={form.casReference || ''} onChange={e => up('casReference', e.target.value)} className="min-h-20 resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">18. Conseils aux femmes enceintes hypertendues :</Label>
            <CheckboxGroup options={CONSEILS_HYPERTENSION} selected={form.conseilsHypertendue || []} onChange={v => up('conseilsHypertendue', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">19. Difficultés dans la surveillance de l'HTA ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.difficultesHta ? 'Oui' : form.difficultesHta === false ? 'Non' : ''} onChange={v => up('difficultesHta', v === 'Oui')} />
            {form.difficultesHta && (
              <Textarea placeholder="Décrivez les difficultés rencontrées…" value={form.detailsDifficultes || ''} onChange={e => up('detailsDifficultes', e.target.value)} className="min-h-16 resize-none mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">21. Améliorations proposées :</Label>
            <Textarea placeholder="Vos suggestions…" value={form.ameliorationsProposees || ''} onChange={e => up('ameliorationsProposees', e.target.value)} className="min-h-16 resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">22. Collaboration avec les relais communautaires ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.collaborationRelais ? 'Oui' : form.collaborationRelais === false ? 'Non' : ''} onChange={v => up('collaborationRelais', v === 'Oui')} />
            {form.collaborationRelais && (
              <Textarea placeholder="Si oui, comment ?" value={form.commentCollaboration || ''} onChange={e => up('commentCollaboration', e.target.value)} className="min-h-16 resize-none mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">23. Les fiches de contre-référence sont-elles renvoyées ?</Label>
            <RadioGroup options={['Oui', 'Non']} value={form.contreRefRenvoyees ? 'Oui' : form.contreRefRenvoyees === false ? 'Non' : ''} onChange={v => up('contreRefRenvoyees', v === 'Oui')} />
            {!form.contreRefRenvoyees && form.contreRefRenvoyees === false && (
              <Textarea placeholder="Si non, pourquoi ?" value={form.pourquoiNonContreRef || ''} onChange={e => up('pourquoiNonContreRef', e.target.value)} className="min-h-16 resize-none mt-2" />
            )}
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">24. Proportion de guérisons / évolutions favorables :</Label>
            <RadioGroup options={PROPORTIONS_GUERISON} value={form.proportionGuerison || ''} onChange={v => up('proportionGuerison', v)} other={form.autreProportionGuerison} onOther={v => up('autreProportionGuerison', v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">25. Femmes ayant plus de risque de complications :</Label>
            <CheckboxGroup options={FEMMES_RISQUE} selected={form.femmesRisqueComplications || []} onChange={v => up('femmesRisqueComplications', v)} />
          </div>

          {/* Score de connaissances */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" /> Résumé de l'enquête
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Section 1 : {form.experiencePro ? '✅' : '⏳'} Sociodémo</span>
              <span>Section 2 : {form.defHta ? '✅' : '⏳'} Connaissances</span>
              <span>Section 3 : {form.freqControleTA ? '✅' : '⏳'} Pratiques</span>
              <span>Section 4 : {form.proportionGuerison ? '✅' : '⏳'} Évolution</span>
            </div>
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
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Stepper */}
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
