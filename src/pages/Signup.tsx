import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Hospital, MoveRight, Loader2, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useData';
import { ROUTE_PATHS, CENTRES } from '@/lib/index';
import { toast } from 'sonner';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    centre: '',
  });
  const [customCentre, setCustomCentre] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.centre || (formData.centre === 'Autre' && !customCentre.trim())) {
      toast.error('Veuillez sélectionner votre centre de santé');
      return;
    }
    
    setLoading(true);
    try {
      await signup(formData.email, formData.password, {
        nom: formData.nom,
        prenom: formData.prenom,
        centre: formData.centre === 'Autre' ? customCentre.trim() : formData.centre,
        role: 'sage-femme'
      });
      toast.success('Compte créé avec succès ! Veuillez vous connecter.');
      navigate(ROUTE_PATHS.LOGIN);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary/10 mb-4 animate-in fade-in zoom-in duration-700 p-3 overflow-hidden">
            <img src="/icon.png" alt="MaterniCare" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Rejoindre MaterniCare</h1>
          <p className="text-slate-500 mt-2 text-center text-sm px-4">
            Créez votre compte professionnel pour sécuriser vos données patientes.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl">
          <CardHeader className="bg-white pb-2 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Informations personnelles
            </CardTitle>
            <CardDescription className="text-xs">Identifiez-vous pour utiliser la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="bg-white pt-6 p-8">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prenom" className="text-xs font-bold uppercase tracking-wider text-slate-500">Prénom</Label>
                  <div className="relative">
                    <Input 
                      id="prenom"
                      placeholder="Prénom"
                      required
                      value={formData.prenom}
                      onChange={e => setFormData({...formData, prenom: e.target.value})}
                      className="bg-slate-50 border-slate-100 h-11 focus:bg-white transition-all pl-4"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom</Label>
                  <div className="relative">
                    <Input 
                      id="nom"
                      placeholder="Nom"
                      required
                      value={formData.nom}
                      onChange={e => setFormData({...formData, nom: e.target.value})}
                      className="bg-slate-50 border-slate-100 h-11 focus:bg-white transition-all pl-4"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Professionnel</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <Input 
                    id="email"
                    type="email"
                    placeholder="nom@hopital.bj"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="pl-11 bg-slate-50 border-slate-100 h-11 focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="centre" className="text-xs font-bold uppercase tracking-wider text-slate-500">Centre de santé</Label>
                <div className="relative">
                  <Hospital className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 z-10" />
                  <select 
                    id="centre"
                    required
                    className="w-full pl-11 bg-slate-50 border border-slate-100 h-11 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                    value={formData.centre}
                    onChange={e => setFormData({...formData, centre: e.target.value})}
                  >
                    <option value="">Sélectionner votre structure</option>
                    {CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {formData.centre === 'Autre' && (
                  <Input
                    placeholder="Nom de votre centre de santé"
                    value={customCentre}
                    onChange={e => setCustomCentre(e.target.value)}
                    className="bg-slate-50 border-slate-100 h-11 focus:bg-white transition-all pl-4"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5 pb-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
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
                    Créer mon compte <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50/50 py-6 border-t border-slate-100 flex justify-center">
            <p className="text-slate-500 text-sm font-medium">
              Déjà un compte ?{' '}
              <Link to={ROUTE_PATHS.LOGIN} className="text-primary hover:underline font-bold transition-all">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Branding Slogan small */}
        <div className="mt-8 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Données Sécurisées</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Usage Médical</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

