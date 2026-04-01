import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Activity, ShieldCheck, Zap, ArrowRight, Hospital, Users, BookOpen, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/index';

export default function Welcome() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Immersive Header (Safe Area Aware) */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-100 flex items-center justify-between px-6 h-16 pt-[calc(var(--safe-area-top))]">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-primary/20" />
          <span className="font-bold text-lg tracking-tight text-slate-900">MaterniCare</span>
        </div>
        <div className="flex items-center gap-2">
          {showInstallBtn && (
            <Button variant="outline" size="sm" onClick={handleInstallClick} className="hidden sm:flex border-primary text-primary hover:bg-primary/5 font-bold btn-active-scale">
              Installer l'App
            </Button>
          )}
          <Link to={ROUTE_PATHS.LOGIN}>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 btn-active-scale">Connexion</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - App Preview Style */}
      <main className="flex-1 pt-24 pb-12 px-6 flex flex-col items-center">
        <div className="w-full max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
          >
            <Smartphone className="w-3.5 h-3.5" /> Application Médicale Certifiée
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.2] sm:leading-[1.1]"
          >
            La surveillance de l'HTA<br />
            <span className="text-primary italic font-black">réinventée</span> pour les Sages-Femmes.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Une expérience applicative fluide pour détecter, suivre et gérer les risques de prééclampsie. Conçu pour le terrain, optimisé pour votre smartphone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button 
                size="lg" 
                onClick={() => navigate(ROUTE_PATHS.LOGIN)}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 group btn-active-scale"
              >
                Lancer l'Application <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              {showInstallBtn ? (
                <Button 
                  size="lg" 
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 btn-active-scale"
                >
                  <Smartphone className="w-5 h-5" /> Installer sur Mobile
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl border-2 border-slate-200 font-bold text-lg hover:bg-slate-50 transition-all btn-active-scale"
                >
                  <Link to="/signup">Créer un compte</Link>
                </Button>
              )}
          </motion.div>

          {/* App Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="pt-12 relative"
          >
            <div className="relative mx-auto rounded-[2.5rem] p-4 bg-slate-900 shadow-2xl w-full max-w-[320px] aspect-[9/19] overflow-hidden border-[8px] border-slate-800">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10" />
              <div className="w-full h-full bg-slate-50 rounded-[1.5rem] overflow-hidden p-4 flex flex-col gap-4">
                <div className="h-4 w-20 bg-slate-200 rounded-full mb-2" />
                <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="h-3 w-24 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-12 w-full bg-slate-50 rounded-lg" />
                  <div className="h-6 w-full bg-primary/5 rounded-lg border border-primary/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 bg-white rounded-2xl shadow-sm border border-slate-100" />
                  <div className="h-24 bg-white rounded-2xl shadow-sm border border-slate-100" />
                </div>
                <div className="h-40 bg-white rounded-2xl shadow-sm border border-slate-100 mt-auto" />
              </div>
            </div>
            
            {/* Floating Badges around mockup */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute top-1/4 right-[10%] hidden md:flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[200px]"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Données Sécurisées</p>
                <p className="text-[10px] text-slate-500">Protection patiente active</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, delay: 1 }}
              className="absolute bottom-1/3 left-[10%] hidden md:flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[200px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Saisie Rapide</p>
                <p className="text-[10px] text-slate-500">Mode registre optimisé</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { icon: <Hospital />, t: "Centres de Santé", d: "Gestion centralisée par centre hospitalier béninois." },
            { icon: <Users />, t: "Suivi Patientes", d: "Historique complet et alertes de prééclampsie automatiques." },
            { icon: <BookOpen />, t: "Formation SFE", d: "Auto-évaluation et renforcement des connaissances SONU." },
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary mb-6">
                {React.cloneElement(f.icon as React.ReactElement, { className: "w-6 h-6" })}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{f.t}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/icon.png" alt="Logo" className="w-6 h-6 rounded shadow-sm" />
          <span className="font-bold text-slate-900">MaterniCare</span>
        </div>
        <p className="text-xs text-slate-400">© 2024 MaterniCare Professional — Usage Médical Uniquement</p>
        <p className="text-[10px] text-slate-300 mt-2 font-medium tracking-widest uppercase">Développé par DeOs</p>
      </footer>
    </div>
  );
}
