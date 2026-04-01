import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Mail, MoveRight, Loader2, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useData';
import { ROUTE_PATHS } from '@/lib/index';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
      <Link to={ROUTE_PATHS.LOGIN} className="fixed top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Retour à la connexion
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Heart className="w-7 h-7 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Mot de passe oublié</h1>
          <p className="text-slate-500 mt-2 text-center text-sm px-4">
            Entrez votre email pour recevoir un lien de récupération.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl">
          <CardHeader className="bg-white pb-2 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Récupération
            </CardTitle>
            <CardDescription className="text-xs">Un lien vous sera envoyé par email</CardDescription>
          </CardHeader>
          <CardContent className="bg-white pt-6 p-8">
            {sent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Email envoyé !</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Vérifiez votre boîte de réception (et vos spams) pour le lien de réinitialisation.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                  Renvoyer un email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="nom@hopital.bj"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
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
                      Envoyer le lien <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50/50 py-6 border-t border-slate-100 flex justify-center">
            <p className="text-slate-500 text-sm font-medium">
              S'inscrire plutôt ?{' '}
              <Link to="/signup" className="text-primary hover:underline font-bold transition-all">
                Créer un compte
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
