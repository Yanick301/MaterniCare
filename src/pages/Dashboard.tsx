import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Heart, TrendingUp, AlertTriangle, Users, Activity, ArrowRight, CheckCircle, Clock, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSFEData, usePatientesData, useAuth } from '@/hooks/useData';
import { ROUTE_PATHS, formatDate } from '@/lib/index';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 300, damping: 30 } }) };

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function Dashboard() {
  const { responses: sfeList, loading: loadingSFE } = useSFEData();
  const { responses: patList, loading: loadingPat } = usePatientesData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loading = loadingSFE || loadingPat;

  const { totalAlertes, tauxHTA, tauxFormation, tauxPreeclampsie, dataExperience, dataAgePatientes, dataSensibilisation, recentActivity } = useMemo(() => {
    const totalAlertes = patList.filter(p => p.alerte).length;
    const tauxHTA = patList.length ? Math.round(patList.filter(p => p.atcdHtaPreeclampsie).length / patList.length * 100) : 0;
    const tauxFormation = sfeList.length ? Math.round(sfeList.filter(s => s.formationHta).length / sfeList.length * 100) : 0;
    const tauxPreeclampsie = patList.length ? Math.round(patList.filter(p => p.connaissancePreeclampsie).length / patList.length * 100) : 0;

    const dataExperience = [
      { name: 'Moins d\'1 an', value: sfeList.filter(s => s.experiencePro === 'Moins de 1 an').length },
      { name: '1-5 ans', value: sfeList.filter(s => s.experiencePro === '1 à 5 ans').length },
      { name: '6-10 ans', value: sfeList.filter(s => s.experiencePro === '6 à 10 ans').length },
      { name: '+10 ans', value: sfeList.filter(s => s.experiencePro === 'Plus de 10 ans').length },
    ].filter(d => d.value > 0);

    const dataAgePatientes = [
      { name: '<18 ans', value: patList.filter(p => p.age === 'Moins de 18 ans').length },
      { name: '18-25 ans', value: patList.filter(p => p.age === '18 - 25 ans').length },
      { name: '26-35 ans', value: patList.filter(p => p.age === '26 - 35 ans').length },
      { name: '≥36 ans', value: patList.filter(p => p.age === '36 ans et plus').length },
    ].filter(d => d.value > 0);

    const dataSensibilisation = [
      { name: 'Connaissent HTA', value: patList.filter(p => p.entenduHtaGrossesse).length, fill: 'var(--chart-1)' },
      { name: 'Connaissent prééclampsie', value: patList.filter(p => p.connaissancePreeclampsie).length, fill: 'var(--chart-2)' },
      { name: 'Savent le danger', value: patList.filter(p => p.dangerHtaMereBebe).length, fill: 'var(--chart-4)' },
    ];

    const recentActivity = [
      ...sfeList.slice(0, 2).map(s => ({ id: s.id, type: 'sfe' as const, titre: `Enquête SFE – ${s.sageFemme}`, date: s.date, alerte: s.alerte, statut: s.statut })),
      ...patList.slice(0, 2).map(p => ({ id: p.id, type: 'pat' as const, titre: `Patiente – ${p.centre}`, date: p.date, alerte: p.alerte, statut: p.statut })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

    return { totalAlertes, tauxHTA, tauxFormation, tauxPreeclampsie, dataExperience, dataAgePatientes, dataSensibilisation, recentActivity };
  }, [sfeList, patList]);

  const stats = [
    { label: 'Enquêtes Sages-Femmes', value: sfeList.length, icon: Stethoscope, color: 'bg-primary/10 text-primary', delta: 'Profil SFE' },
    { label: 'Enquêtes Patientes', value: patList.length, icon: Heart, color: 'bg-accent/20 text-accent-foreground', delta: 'Suivi prénatal' },
    { label: 'Alertes Actives', value: totalAlertes, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive', delta: totalAlertes > 0 ? 'Urgent' : 'RAS' },
    { label: 'Taux Formation SFE', value: `${tauxFormation}%`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700', delta: 'SONU' },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-pulse">
        <div className="h-20 bg-secondary rounded-2xl w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-secondary rounded-2xl" />)}
        </div>
        <div className="h-64 bg-secondary rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Entête */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bienvenue, <span className="text-primary font-semibold">{user?.prenom} {user?.nom}</span> · {user?.centre}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate(ROUTE_PATHS.FORMULAIRE_SFE)} className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/25">
              <ClipboardList className="w-4 h-4" /> Nouvelle enquête SFE
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(ROUTE_PATHS.FORMULAIRE_PATIENTE)} className="gap-2">
              <Heart className="w-4 h-4" /> Patiente
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(ROUTE_PATHS.FORMULAIRE_PATIENTE_HTA)} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Activity className="w-4 h-4" /> Suivi HTA
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Alerte prééclampsie si des alertes existent */}
      {totalAlertes > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-destructive/10 border-l-4 border-destructive rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">{totalAlertes} patiente(s) à risque détectée(s)</p>
            <p className="text-xs text-destructive/80 mt-0.5">Des signes évocateurs de prééclampsie ont été identifiés. Consultez l'historique pour plus de détails.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTE_PATHS.HISTORIQUE)} className="ml-auto shrink-0 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
            Voir <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium leading-tight">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.delta}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Métriques clés */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Antécédent HTA grossesse', value: `${tauxHTA}%`, desc: 'des patientes interrogées', color: 'text-destructive' },
          { label: 'Taux mesure TA systématique', value: `${sfeList.length ? Math.round(sfeList.filter(s => s.mesureSystematiqueTA === 'Toujours').length / sfeList.length * 100) : 0}%`, desc: 'sages-femmes "Toujours"', color: 'text-primary' },
          { label: 'Connaissance prééclampsie', value: `${tauxPreeclampsie}%`, desc: 'des patientes informées', color: 'text-emerald-600' },
        ].map((m, i) => (
          <motion.div key={m.label} custom={i + 4} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-sm font-medium text-foreground mt-1">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar: Expérience SFE */}
        <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Expérience des Sages-Femmes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataExperience} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Sages-femmes" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie: Âge des patientes */}
        <motion.div custom={9} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Répartition par Âge – Patientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dataAgePatientes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                    {dataAgePatientes.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sensibilisation bar chart */}
      <motion.div custom={10} initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Niveau de sensibilisation des patientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataSensibilisation.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold text-foreground">{patList.length ? Math.round(d.value / patList.length * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${patList.length ? Math.round(d.value / patList.length * 100) : 0}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activité récente */}
      <motion.div custom={11} initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTE_PATHS.HISTORIQUE)} className="text-xs text-primary gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'sfe' ? 'bg-primary/15 text-primary' : 'bg-accent/20 text-accent-foreground'}`}>
                    {a.type === 'sfe' ? <ClipboardList className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.titre}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.alerte && <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Alerte</Badge>}
                    {a.statut === 'complet' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
