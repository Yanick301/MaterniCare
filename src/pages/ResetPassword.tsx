import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, MoveRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useData';
import { ROUTE_PATHS } from '@/lib/index';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { updatePassword, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If we're not authenticated after coming from a recovery link, something is wrong
    // But Supabase should handle the session assignment automatically
    if (isReady && !isAuthenticated) {
      toast.error("Session expirée ou invalide. Veuillez redemander un lien.");
      navigate(ROUTE_PATHS.LOGIN);
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast.success('Mot de passe mis à jour !');
      navigate(ROUTE_PATHS.DASHBOARD);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Heart className="w-7 h-7 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Nouveau Mot de passe</h1>
          <p className="text-slate-500 mt-2 text-center text-sm px-4">
            Sécurisez votre compte avec un nouveau mot de passe robuste.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl">
          <CardHeader className="bg-white pb-2 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Sécurité
            </CardTitle>
            <CardDescription className="text-xs">Choisissez un mot de passe fort</CardDescription>
          </CardHeader>
          <CardContent className="bg-white pt-6 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nouveau Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-11 bg-slate-50 border-slate-100 h-11 focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirmer le Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <Input 
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-11 bg-slate-50 border-slate-100 h-11 focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Enregistrer <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-4 opacity-50">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Mise à jour immédiate</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
