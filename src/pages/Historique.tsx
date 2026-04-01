import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSFEData, usePatientesData } from '@/hooks/useData';
import { formatDate, ROUTE_PATHS } from '@/lib/index';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ClipboardList, Heart, AlertTriangle, CheckCircle, Clock, Search, Trash2, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

type Tab = 'sfe' | 'patientes';

// ─── Color Palette (matches app theme) ──────────────────────
const PDF_COLORS = {
  primary: [244, 63, 94] as [number, number, number],      // rose-500
  primaryDark: [225, 29, 72] as [number, number, number],   // rose-600
  primaryLight: [255, 228, 230] as [number, number, number], // rose-100
  text: [15, 23, 42] as [number, number, number],            // slate-900
  textMuted: [100, 116, 139] as [number, number, number],    // slate-500
  textLight: [148, 163, 184] as [number, number, number],    // slate-400
  border: [226, 232, 240] as [number, number, number],       // slate-200
  bg: [248, 250, 252] as [number, number, number],           // slate-50
  white: [255, 255, 255] as [number, number, number],
  alert: [220, 38, 38] as [number, number, number],          // red-600
  alertBg: [254, 242, 242] as [number, number, number],      // red-50
  success: [22, 163, 74] as [number, number, number],        // green-600
  successBg: [240, 253, 244] as [number, number, number],    // green-50
  warning: [217, 119, 6] as [number, number, number],        // amber-600
  warningBg: [255, 251, 235] as [number, number, number],    // amber-50
};

// ─── PDF Helpers ─────────────────────────────────────────────
function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.primaryDark);
  doc.text(title, margin + 6, y + 3);
  return y + 14;
}

function drawField(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth: number = 170): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text(label, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.text);
  const lines = doc.splitTextToSize(value || '—', maxWidth);
  doc.text(lines, x, y + 5);

  return y + 5 + lines.length * 5;
}

function drawTwoColumns(doc: jsPDF, label1: string, val1: string, label2: string, val2: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const colWidth = (pageWidth - margin * 2 - 10) / 2;

  const y1 = drawField(doc, label1, val1, margin, y, colWidth);
  const y2 = drawField(doc, label2, val2, margin + colWidth + 10, y, colWidth);
  return Math.max(y1, y2);
}

function drawBadge(doc: jsPDF, text: string, x: number, y: number, type: 'alert' | 'success' | 'warning' | 'info'): number {
  const colors: Record<string, [number, number, number, number, number, number]> = {
    alert: [PDF_COLORS.alertBg, PDF_COLORS.alert],
    success: [PDF_COLORS.successBg, PDF_COLORS.success],
    warning: [PDF_COLORS.warningBg, PDF_COLORS.warning],
    info: [[241, 245, 249], PDF_COLORS.textMuted],
  };
  const [bg, fg] = colors[type] || colors.info;

  doc.setFontSize(8);
  const textWidth = doc.getTextWidth(text) + 8;

  doc.setFillColor(...(bg as [number, number, number]));
  doc.roundedRect(x, y - 3.5, textWidth, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...(fg as [number, number, number]));
  doc.setFont('helvetica', 'bold');
  doc.text(text, x + 4, y + 1.5);

  return textWidth;
}

function drawTags(doc: jsPDF, items: string[], x: number, y: number, maxWidth: number): number {
  let cx = x;
  let cy = y;
  const lineH = 8;

  for (const item of items) {
    doc.setFontSize(7);
    const tw = doc.getTextWidth(item) + 6;
    if (cx + tw > x + maxWidth && cx > x) {
      cx = x;
      cy += lineH;
    }
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cx, cy - 3, tw, 6, 1, 1, 'F');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(item, cx + 3, cy + 1);
    cx += tw + 3;
  }
  return cy + lineH;
}

function addFooter(doc: jsPDF, pageNum: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...PDF_COLORS.border);
  doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  doc.text('MaterniCare — Plateforme de suivi prénatal HTA & Prééclampsie', 20, pageHeight - 12);
  doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 12, { align: 'right' });
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
}

// ─── Header avec logo ────────────────────────────────────────
function drawHeader(doc: jsPDF, title: string, subtitle: string, pageNum: { current: number }): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Banner rose
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Logo (rond blanc)
  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(margin, 6, 26, 26, 5, 5, 'F');

  // Icône cœur stylisée dans le rond
  doc.setFillColor(...PDF_COLORS.primary);
  doc.setFontSize(16);
  doc.text('\u2665', margin + 9, 23);

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text('MaterniCare', margin + 34, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, margin + 34, 26);

  // Date à droite
  doc.setFontSize(8);
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(dateStr, pageWidth - margin, 18, { align: 'right' });

  // Titre de la fiche
  const y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.primaryDark);
  doc.text(title, margin, y);

  addFooter(doc, pageNum.current);
  return y + 10;
}

// ─── Vérifier espace page ────────────────────────────────────
function checkPage(doc: jsPDF, y: number, needed: number, pageNum: { current: number }): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 25) {
    doc.addPage();
    pageNum.current++;
    addFooter(doc, pageNum.current);
    return 20;
  }
  return y;
}

export default function Historique() {
  const { responses: sfe, remove: removeSFE } = useSFEData();
  const { responses: pat, remove: removePat } = usePatientesData();
  const [tab, setTab] = useState<Tab>('patientes');
  const [search, setSearch] = useState('');
  const [filterAlerte, setFilterAlerte] = useState(false);
  const navigate = useNavigate();

  const filteredSFE = sfe.filter(s =>
    (s.sageFemme.toLowerCase().includes(search.toLowerCase()) || s.centre.toLowerCase().includes(search.toLowerCase())) &&
    (!filterAlerte || s.alerte)
  );
  const filteredPat = pat.filter(p =>
    (p.centre.toLowerCase().includes(search.toLowerCase()) || p.sageFemme.toLowerCase().includes(search.toLowerCase())) &&
    (!filterAlerte || p.alerte)
  );

  // ─── Export PDF Patiente ──────────────────────────────────
  const exportPatientePDF = (id: string) => {
    const p = pat.find(x => x.id === id);
    if (!p) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageNum = { current: 1 };

    let y = drawHeader(doc, `Fiche Patiente`, `${p.prenomPatiente} ${p.nomPatiente} — ${p.centre}`, pageNum);

    // Alerte banner
    if (p.alerte) {
      y = checkPage(doc, y, 16, pageNum);
      doc.setFillColor(...PDF_COLORS.alertBg);
      doc.setDrawColor(...PDF_COLORS.alert);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...PDF_COLORS.alert);
      doc.text('ALERTERTE PRECLAMPSIE', margin + 6, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Signes detectes: ${p.signesAlerte.join(', ')}`, margin + 6, y + 11);
      y += 20;
    }

    // Informations patiente
    y = checkPage(doc, y, 40, pageNum);
    y = drawSectionHeader(doc, 'INFORMATIONS PATIENTE', y);
    y = drawTwoColumns(doc, 'Nom complet', `${p.prenomPatiente} ${p.nomPatiente}`, 'Telephone', p.telephonePatiente, y);
    y = drawTwoColumns(doc, 'Date de saisie', formatDate(p.date), 'Sage-femme', p.sageFemme, y);
    y = drawField(doc, 'Centre de sante', p.centre, margin, y);
    y += 4;

    // Section 1: Socio-demographiques
    y = checkPage(doc, y, 45, pageNum);
    y = drawSectionHeader(doc, '1. DONNEES SOCIO-DEMOGRAPHIQUES', y);
    y = drawTwoColumns(doc, 'Age', p.age, 'Situation matrimoniale', p.situationMatrimoniale, y);
    y = drawTwoColumns(doc, "Niveau d'instruction", p.niveauInstruction, 'Profession', p.profession + (p.autreProfession ? ` (${p.autreProfession})` : ''), y);
    y = drawField(doc, 'Lieu de residence', p.lieuResidence, margin, y);
    y += 4;

    // Section 2: Antecedents obstetricaux
    y = checkPage(doc, y, 35, pageNum);
    y = drawSectionHeader(doc, '2. ANTECEDENTS OBSTETRICAUX', y);
    y = drawTwoColumns(doc, 'Nombre de grossesses', p.nbGrossesses, 'Enfants vivants', p.nbEnfantsVivants, y);
    y = drawTwoColumns(doc, 'Fausse couche', p.fauxCouche ? 'Oui' : 'Non', 'ATCD HTA/Preeclampsie', p.atcdHtaPreeclampsie ? 'Oui — FACTEUR DE RISQUE' : 'Non', y);
    y += 4;

    // Section 3: Suivi prenatal
    y = checkPage(doc, y, 45, pageNum);
    y = drawSectionHeader(doc, '3. SUIVI PRENATAL', y);
    y = drawTwoColumns(doc, 'Inscrite en CPN', p.inscriteCpn ? 'Oui' : 'Non', 'Mois debut CPN', p.inscriteCpn ? p.moisDebutCpn : 'N/A', y);
    y = drawTwoColumns(doc, 'Nb consultations', p.nbConsultations, 'Suivi assure par', p.suivi + (p.autreSuivi ? ` (${p.autreSuivi})` : ''), y);
    y = drawField(doc, 'TA mesuree lors CPN', p.taMesuree, margin, y);
    y += 4;

    // Section 4: Connaissances & sensibilisation
    y = checkPage(doc, y, 55, pageNum);
    y = drawSectionHeader(doc, '4. CONNAISSANCES & SENSIBILISATION', y);
    y = drawTwoColumns(doc, 'Connait HTA grossesse', p.entenduHtaGrossesse ? 'Oui' : 'Non', 'Sait danger HTA', p.dangerHtaMereBebe ? 'Oui' : 'Non', y);
    y = drawTwoColumns(doc, 'Connait preeclampsie', p.connaissancePreeclampsie ? 'Oui' : 'Non', 'Source info', p.sourceInfoPreeclampsie + (p.autreSource ? ` (${p.autreSource})` : ''), y);

    if (p.signesAlerte.length > 0) {
      y = checkPage(doc, y, 15, pageNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text('Signes d alerte connus', margin, y);
      y += 4;
      y = drawTags(doc, p.signesAlerte, margin, y, pageWidth - margin * 2);
      y += 2;
    }

    y = checkPage(doc, y, 20, pageNum);
    y = drawTwoColumns(doc, 'SF explique signes danger', p.sfExpliqueSgnsDanger ? 'Oui' : 'Non', 'Lesquels', p.sfExpliqueSgnsDanger ? p.lesquelsSgnsDanger : 'N/A', y);
    y = drawTwoColumns(doc, 'Conseils de prevention', p.conseilsPrevention ? 'Oui' : 'Non', 'Lesquels', p.conseilsPrevention ? p.lesquelsConseils : 'N/A', y);
    y = drawTwoColumns(doc, 'Satisfaction du suivi', p.satisfactionSuivi ? 'Oui' : 'Non', 'Suggestions', p.autreSuggestions || (p.suggestions.length > 0 ? p.suggestions.join(', ') : 'Aucune'), y);

    // Footer statut
    y += 6;
    y = checkPage(doc, y, 12, pageNum);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    const statusLabel = p.statut === 'complet' ? 'Complet' : 'Brouillon';
    drawBadge(doc, statusLabel, margin, y, p.statut === 'complet' ? 'success' : 'warning');
    if (p.alerte) {
      drawBadge(doc, 'ALERTE', margin + 30, y, 'alert');
    }

    doc.save(`fiche-patiente-${p.nomPatiente || 'patient'}-${p.id}.pdf`);
  };

  // ─── Export PDF SFE ──────────────────────────────────────
  const exportSFEPDF = (id: string) => {
    const s = sfe.find(x => x.id === id);
    if (!s) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageNum = { current: 1 };

    let y = drawHeader(doc, `Fiche Enquete Sage-Femme`, `${s.sageFemme} — ${s.centre}`, pageNum);

    // Score connaissances
    const score =
      (s.defHta === 'TA >=140/90 mmHg' ? 25 : 0) +
      (s.caracPreeclampsie === 'HTA + proteinurie' ? 25 : 0) +
      (s.ageGestationnel === "Apres 20 semaines d'amenorrhee" ? 25 : 0) +
      ((s.factRisque || []).length >= 3 ? 25 : 0);

    y = checkPage(doc, y, 20, pageNum);
    doc.setFillColor(score >= 75 ? 240 : score >= 50 ? 255 : 254, score >= 75 ? 253 : score >= 50 ? 251 : 242, score >= 75 ? 244 : score >= 50 ? 235 : 242);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(score >= 75 ? 22 : score >= 50 ? 217 : 220, score >= 75 ? 163 : score >= 50 ? 119 : 38, score >= 75 ? 74 : score >= 50 ? 6 : 38);
    doc.text(`Score de connaissances: ${score}/100`, margin + 6, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(score >= 75 ? 'Excellent niveau' : score >= 50 ? 'Niveau moyen' : 'Formation recommandee', margin + 6, y + 10);
    y += 18;

    // Informations sage-femme
    y = checkPage(doc, y, 40, pageNum);
    y = drawSectionHeader(doc, 'INFORMATIONS SAGE-FEMME', y);
    y = drawTwoColumns(doc, 'Nom', s.sageFemme, 'Age', s.age ? `${s.age} ans` : '—', y);
    y = drawTwoColumns(doc, 'Centre', s.centre, 'Date de saisie', formatDate(s.date), y);
    y = drawTwoColumns(doc, 'Experience professionnelle', s.experiencePro, 'Formation HTA/SONU', s.formationHta ? `Oui (${s.anneeFormation || '—'})` : 'Non', y);
    y += 4;

    // Section 2: Connaissances medicales
    y = checkPage(doc, y, 50, pageNum);
    y = drawSectionHeader(doc, '2. CONNAISSANCES MEDICALES', y);
    y = drawField(doc, "Definition de l'HTA", s.defHta || 'Non renseigne', margin, y);
    y = drawField(doc, 'Caracteristique preeclampsie', s.caracPreeclampsie || 'Non renseigne', margin, y);
    y = drawField(doc, 'Age gestationnel apparition', s.ageGestationnel || 'Non renseigne', margin, y);

    if (s.factRisque?.length > 0) {
      y = checkPage(doc, y, 12, pageNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text('Facteurs de risque identifies', margin, y);
      y += 4;
      y = drawTags(doc, s.factRisque, margin, y, pageWidth - margin * 2);
      y += 2;
    }

    if (s.signesCliniques?.length > 0) {
      y = checkPage(doc, y, 12, pageNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text('Signes cliniques evocateurs', margin, y);
      y += 4;
      y = drawTags(doc, s.signesCliniques, margin, y, pageWidth - margin * 2);
      y += 2;
    }
    y += 4;

    // Section 3: Pratiques professionnelles
    y = checkPage(doc, y, 60, pageNum);
    y = drawSectionHeader(doc, '3. PRATIQUES PROFESSIONNELLES', y);
    y = drawTwoColumns(doc, 'Frequence controle TA', s.freqControleTA, 'Mesure systematique TA', s.mesureSystematiqueTA, y);
    y = drawTwoColumns(doc, 'Recherche proteinurie', s.recherchProteinurie, 'Surveillance mvt foetaux', s.surveillanceMvtFoetaux ? 'Oui' : 'Non', y);

    if (s.conduiteHtaGrossesse?.length > 0) {
      y = checkPage(doc, y, 12, pageNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text('Conduite a tenir en cas d HTA', margin, y);
      y += 4;
      y = drawTags(doc, s.conduiteHtaGrossesse, margin, y, pageWidth - margin * 2);
      y += 2;
    }

    if (s.antihypertensifs?.length > 0) {
      y = checkPage(doc, y, 12, pageNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text('Antihypertensifs utilises', margin, y);
      y += 4;
      y = drawTags(doc, s.antihypertensifs, margin, y, pageWidth - margin * 2);
      y += 2;
    }

    y = checkPage(doc, y, 30, pageNum);
    y = drawField(doc, 'Cas de reference', s.casReference, margin, y);
    y = drawTwoColumns(doc, 'Difficultes HTA', s.difficultesHta ? 'Oui' : 'Non', 'Details', s.difficultesHta ? s.detailsDifficultes : 'N/A', y);
    y = drawField(doc, 'Ameliorations proposees', s.ameliorationsProposees, margin, y);
    y += 4;

    // Section 4: Evolution & collaboration
    y = checkPage(doc, y, 35, pageNum);
    y = drawSectionHeader(doc, '4. EVOLUTION & COLLABORATION', y);
    y = drawTwoColumns(doc, 'Collaboration relais', s.collaborationRelais ? 'Oui' : 'Non', 'Commentaire', s.collaborationRelais ? s.commentCollaboration : 'N/A', y);
    y = drawTwoColumns(doc, 'Contre-references renvoyees', s.contreRefRenvoyees ? 'Oui' : 'Non', 'Raison', !s.contreRefRenvoyees ? s.pourquoiNonContreRef : 'N/A', y);
    y = drawField(doc, 'Proportion guerison/evolution favorable', s.proportionGuerison, margin, y);

    if (s.femmesRisqueComplications?.length > 0) {
      y = checkPage(doc, y, 12, pageNum);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text('Femmes a risque de complications', margin, y);
      y += 4;
      y = drawTags(doc, s.femmesRisqueComplications, margin, y, pageWidth - margin * 2);
      y += 2;
    }

    // Footer statut
    y += 6;
    y = checkPage(doc, y, 12, pageNum);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    drawBadge(doc, s.statut === 'complet' ? 'Complet' : 'Brouillon', margin, y, s.statut === 'complet' ? 'success' : 'warning');
    if (s.formationHta) {
      drawBadge(doc, 'Formee SONU', margin + 30, y, 'info');
    }

    doc.save(`fiche-sfe-${s.sageFemme || 'sage-femme'}-${s.id}.pdf`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historique</h1>
          <p className="text-sm text-muted-foreground">Toutes les enquetes enregistrees</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(ROUTE_PATHS.FORMULAIRE_SFE)} className="gap-1 bg-primary text-xs">
            <ClipboardList className="w-3 h-3" /> + SFE
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTE_PATHS.FORMULAIRE_PATIENTE)} className="gap-1 text-xs">
            <Heart className="w-3 h-3" /> + Patiente
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par centre ou sage-femme…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Button size="sm" variant={filterAlerte ? 'destructive' : 'outline'} onClick={() => setFilterAlerte(v => !v)} className="gap-2 text-xs">
          <Filter className="w-3 h-3" /> {filterAlerte ? 'Alertes seulement' : 'Toutes'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'patientes' as Tab, label: 'Patientes', count: filteredPat.length, icon: Heart }, { id: 'sfe' as Tab, label: 'Sages-Femmes', count: filteredSFE.length, icon: ClipboardList }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
            <Badge className={`text-xs ml-1 ${tab === t.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>{t.count}</Badge>
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {tab === 'patientes' && (
          filteredPat.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">Aucune enquete patiente trouvee.</CardContent></Card>
          ) : filteredPat.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-2 transition-all ${p.alerte ? 'border-destructive/30 bg-destructive/3' : 'border-border hover:border-primary/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.alerte ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {p.alerte ? <AlertTriangle className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">
                          {p.prenomPatiente} {p.nomPatiente}
                        </span>
                        <span className="text-xs text-muted-foreground">· {p.telephonePatiente}</span>
                        {p.alerte && <Badge variant="destructive" className="text-xs">Alerte</Badge>}
                        {p.statut === 'complet' ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Complet</Badge> : <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">Brouillon</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.age} · {p.centre} · {formatDate(p.date)}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.atcdHtaPreeclampsie && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">ATCD HTA</span>}
                        {p.inscriteCpn && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">CPN</span>}
                        {p.connaissancePreeclampsie && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Connait preeclampsie</span>}
                        {p.signesAlerte.length > 0 && !p.signesAlerte.includes('Je ne sais pas') && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{p.signesAlerte.length} signe(s) d'alerte</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => exportPatientePDF(p.id)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Exporter PDF">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removePat(p.id)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}

        {tab === 'sfe' && (
          filteredSFE.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">Aucune enquete sage-femme trouvee.</CardContent></Card>
          ) : filteredSFE.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-2 border-border hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{s.sageFemme || 'N/A'}</span>
                        {s.statut === 'complet' ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Complet</Badge> : <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs"><Clock className="w-3 h-3 mr-1" />Brouillon</Badge>}
                        {s.formationHta && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Formee SONU</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.centre} · {formatDate(s.date)}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{s.experiencePro}</span>
                        {s.mesureSystematiqueTA && <span className={`text-xs px-2 py-0.5 rounded-full ${s.mesureSystematiqueTA === 'Toujours' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>TA: {s.mesureSystematiqueTA}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => exportSFEPDF(s.id)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Exporter PDF">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeSFE(s.id)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
