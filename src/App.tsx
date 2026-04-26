import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useData';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import FormulaireSFE from '@/pages/FormulaireSFE';
import FormulairePatiente from '@/pages/FormulairePatiente';
import Statistiques from '@/pages/Statistiques';
import Historique from '@/pages/Historique';

import Welcome from '@/pages/Welcome';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import QuestionnairePartage from '@/pages/QuestionnairePartage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  
  if (!isReady) return null; // Wait for auth to be ready
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTE_PATHS.LOGIN} replace />;
}

export default function App() {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl shadow-primary/20 flex items-center justify-center mb-8 p-4"
        >
          <img src="/icon.png" alt="MaterniCare" className="w-full h-full object-contain" />
        </motion.div>
        <div className="h-1 bg-primary/20 w-32 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="h-full w-full bg-primary"
          />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTE_PATHS.HOME} element={<Welcome />} />
        <Route path={ROUTE_PATHS.LOGIN} element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/questionnaire/sfe/:shareId" element={<QuestionnairePartage />} />
        <Route path="/questionnaire/:shareId" element={<QuestionnairePartage />} />

        {/* Protected App Routes */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path={ROUTE_PATHS.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTE_PATHS.FORMULAIRE_SFE} element={<FormulaireSFE />} />
          <Route path={ROUTE_PATHS.FORMULAIRE_PATIENTE} element={<FormulairePatiente />} />
          <Route path={ROUTE_PATHS.STATISTIQUES} element={<Statistiques />} />
          <Route path={ROUTE_PATHS.HISTORIQUE} element={<Historique />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
      </Routes>
    </Router>
  );
}
