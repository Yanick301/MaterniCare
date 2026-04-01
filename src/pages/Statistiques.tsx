import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSFEData, usePatientesData } from '@/hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { BarChart3, Users, Heart, TrendingUp } from 'lucide-react';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const fade = (i: number) => ({ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 280, damping: 28 } } });

export default function Statistiques() {
  const { responses: sfe } = useSFEData();
  const { responses: pat } = usePatientesData();

  const {
    dataFormationSFE, dataMesureTA, dataProteinurie, dataExperience,
    dataAges, dataInstruction, dataSensib, dataResidence, dataCPN, dataAlertes, kpis
  } = useMemo(() => {
    const dataFormationSFE = [
      { name: 'Formées (HTA/SONU)', value: sfe.filter(s => s.formationHta).length, fill: 'var(--chart-1)' },
      { name: 'Non formées', value: sfe.filter(s => !s.formationHta).length, fill: 'var(--chart-2)' },
    ];
    const dataMesureTA = [
      { name: 'Toujours', value: sfe.filter(s => s.mesureSystematiqueTA === 'Toujours').length },
      { name: 'Parfois', value: sfe.filter(s => s.mesureSystematiqueTA === 'Parfois').length },
      { name: 'Jamais', value: sfe.filter(s => s.mesureSystematiqueTA === 'Jamais').length },
    ];
    const dataProteinurie = [
      { name: 'Toujours', value: sfe.filter(s => s.recherchProteinurie === 'Toujours').length },
      { name: 'Parfois', value: sfe.filter(s => s.recherchProteinurie === 'Parfois').length },
      { name: 'Jamais', value: sfe.filter(s => s.recherchProteinurie === 'Jamais').length },
    ];
    const dataExperience = [
      { name: '<1 an', value: sfe.filter(s => s.experiencePro === 'Moins de 1 an').length },
      { name: '1-5 ans', value: sfe.filter(s => s.experiencePro === '1 à 5 ans').length },
      { name: '6-10 ans', value: sfe.filter(s => s.experiencePro === '6 à 10 ans').length },
      { name: '>10 ans', value: sfe.filter(s => s.experiencePro === 'Plus de 10 ans').length },
    ];
    const dataAges = [
      { name: '<18 ans', value: pat.filter(p => p.age === 'Moins de 18 ans').length },
      { name: '18-25 ans', value: pat.filter(p => p.age === '18 - 25 ans').length },
      { name: '26-35 ans', value: pat.filter(p => p.age === '26 - 35 ans').length },
      { name: '≥36 ans', value: pat.filter(p => p.age === '36 ans et plus').length },
    ];
    const dataInstruction = [
      { name: 'Aucun', value: pat.filter(p => p.niveauInstruction === 'Aucun').length },
      { name: 'Primaire', value: pat.filter(p => p.niveauInstruction === 'Primaire').length },
      { name: 'Secondaire', value: pat.filter(p => p.niveauInstruction === 'Secondaire').length },
      { name: 'Supérieur', value: pat.filter(p => p.niveauInstruction === 'Supérieur').length },
    ];
    const dataSensib = [
      { subject: 'Connaît HTA', A: pat.filter(p => p.entenduHtaGrossesse).length, fullMark: pat.length },
      { subject: 'Danger HTA', A: pat.filter(p => p.dangerHtaMereBebe).length, fullMark: pat.length },
      { subject: 'Connaît prééclampsie', A: pat.filter(p => p.connaissancePreeclampsie).length, fullMark: pat.length },
      { subject: 'SF explique danger', A: pat.filter(p => p.sfExpliqueSgnsDanger).length, fullMark: pat.length },
      { subject: 'Conseils reçus', A: pat.filter(p => p.conseilsPrevention).length, fullMark: pat.length },
    ];
    const dataResidence = [
      { name: 'Urbain', value: pat.filter(p => p.lieuResidence === 'Urbain').length, fill: 'var(--chart-3)' },
      { name: 'Rural', value: pat.filter(p => p.lieuResidence === 'Rural').length, fill: 'var(--chart-4)' },
    ];
    const dataCPN = [
      { name: 'CPN inscrites', value: pat.filter(p => p.inscriteCpn).length },
      { name: 'Non inscrites', value: pat.filter(p => !p.inscriteCpn).length },
    ];
    const dataAlertes = [
      { name: 'Sans alerte', value: pat.filter(p => !p.alerte).length },
      { name: 'Alerte prééclampsie', value: pat.filter(p => p.alerte).length },
    ];
    const kpis = [
      { label: 'Total SFE', value: sfe.length, icon: Users, color: 'text-primary' },
      { label: 'Total Patientes', value: pat.length, icon: Heart, color: 'text-accent-foreground' },
      { label: '% formées SONU', value: `${sfe.length ? Math.round(sfe.filter(s => s.formationHta).length / sfe.length * 100) : 0}%`, icon: TrendingUp, color: 'text-emerald-600' },
      { label: 'Alertes prééclampsie', value: pat.filter(p => p.alerte).length, icon: BarChart3, color: 'text-destructive' },
    ];

    return { dataFormationSFE, dataMesureTA, dataProteinurie, dataExperience, dataAges, dataInstruction, dataSensib, dataResidence, dataCPN, dataAlertes, kpis };
  }, [sfe, pat]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Analyse des donnees collectees</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial="hidden" animate="visible" variants={fade(i)}>
            <Card className="border-border text-center">
              <CardContent className="p-4">
                <k.icon className={`w-6 h-6 ${k.color} mx-auto mb-2`} />
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Section SFE */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Sages-Femmes</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <motion.div initial="hidden" animate="visible" variants={fade(4)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Formation HTA / SONU</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={dataFormationSFE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" nameKey="name">
                    {dataFormationSFE.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie><Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fade(5)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Expérience professionnelle</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dataExperience} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" name="SFE" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fade(6)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Mesure systématique de la TA</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dataMesureTA} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" name="SFE" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fade(7)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recherche de protéinurie</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dataProteinurie} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" name="SFE" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Section Patientes */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Patientes</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <motion.div initial="hidden" animate="visible" variants={fade(8)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par âge</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dataAges} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" name="Patientes" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fade(9)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Niveau d'instruction</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={dataInstruction} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                    {dataInstruction.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fade(10)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Sensibilisation des patientes</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={dataSensib}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <Radar name="Patientes" dataKey="A" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fade(11)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Alertes prééclampsie</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={dataAlertes} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" nameKey="name">
                    <Cell fill="var(--chart-4)" /><Cell fill="var(--destructive)" />
                  </Pie><Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Résidence + CPN */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { titre: 'Résidence (Urbain / Rural)', data: dataResidence, key: 'pie' },
          { titre: 'Inscription CPN', data: dataCPN, key: 'bar' },
        ].map((item, i) => (
          <motion.div key={item.titre} initial="hidden" animate="visible" variants={fade(12 + i)}>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{item.titre}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  {item.key === 'pie' ? (
                    <PieChart><Pie data={item.data} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name" paddingAngle={4}>
                      {item.data.map((d, idx) => <Cell key={idx} fill={('fill' in d && typeof d.fill === 'string') ? d.fill : COLORS[idx]} />)}
                    </Pie><Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart>
                  ) : (
                    <BarChart data={item.data} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="value" name="Patientes" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
