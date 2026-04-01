import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock, Mail, Eye, EyeOff, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useData';
import { ROUTE_PATHS } from '@/lib/index';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate(ROUTE_PATHS.DASHBOARD);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent/20 p-4">
      {/* Cercles décoratifs */}
      <div className="fixed top-0 left-0 w-96 h-96 rounded-full bg-primary/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full bg-accent/15 translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg shadow-primary/20 mb-4 p-4 overflow-hidden"
          >
            <img src="/icon.png" alt="MaterniCare" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">MaterniCare</h1>
          <p className="text-muted-foreground mt-1 text-sm">Plateforme de suivi prénatal HTA</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">Suivi prenatal — HTA</span>
          </div>
        </div>

        {/* Carte de connexion */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-primary/5">
          <h2 className="text-xl font-semibold text-foreground mb-1">Connexion</h2>
          <p className="text-sm text-muted-foreground mb-6">Accédez à votre espace sage-femme</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-2 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm"
              >
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all btn-active-scale"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">S'inscrire</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-8 font-medium tracking-widest uppercase">
          Développé par DeOs
        </p>
      </motion.div>
    </div>
  );
}
