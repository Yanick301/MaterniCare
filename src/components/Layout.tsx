import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, BarChart3, History, LogOut,
  Heart, Menu, X, Wifi, WifiOff, Bell, UserCircle, ChevronRight, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth, useOnlineStatus } from '@/hooks/useData';
import { useNotifications } from '@/hooks/useNotifications';
import { ROUTE_PATHS } from '@/lib/index';
import { Toaster } from 'sonner';

const NAV_ITEMS = [
  { path: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: ROUTE_PATHS.FORMULAIRE_SFE, icon: ClipboardList, label: 'Enquête Sage-Femme' },
  { path: ROUTE_PATHS.FORMULAIRE_PATIENTE, icon: Heart, label: 'Enquête Patiente' },
  { path: ROUTE_PATHS.FORMULAIRE_PATIENTE_HTA, icon: Activity, label: 'Suivi HTA' },
  { path: ROUTE_PATHS.STATISTIQUES, icon: BarChart3, label: 'Statistiques' },
  { path: ROUTE_PATHS.HISTORIQUE, icon: History, label: 'Historique' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { permission, requestPermission } = useNotifications();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.LOGIN);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <img src="/icon.png" alt="Logo" className="w-9 h-9 rounded-xl shadow-md shadow-primary/30" />
        <div>
          <span className="font-bold text-sidebar-foreground text-base tracking-tight">MaterniCare</span>
          <p className="text-[10px] text-muted-foreground leading-none font-medium">HTA & Prééclampsie</p>
        </div>
      </div>

      {/* Statut connexion */}
      <div className="px-4 py-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'En ligne' : 'Hors ligne – mode local'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.centre}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full text-xs gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
        >
          <LogOut className="w-3 h-3" />
          Déconnexion
        </Button>
        <p className="text-center text-[9px] text-muted-foreground/40 mt-4 font-medium tracking-[0.2em] uppercase">
          Développé par DeOs
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 lg:hidden shadow-2xl"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header (Safe Area Aware) */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 glass border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg shadow-lg shadow-primary/20 lg:hidden overflow-hidden">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Session Active • {user?.centre}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isOnline && (
              <Badge variant="outline" className="hidden sm:flex text-amber-600 border-amber-300 bg-amber-50 text-[10px] uppercase tracking-wider px-2 py-0 h-6 gap-1">
                <WifiOff className="w-3 h-3" />
                Hors ligne
              </Badge>
            )}
            <button 
              onClick={() => requestPermission()}
              className={`relative p-2.5 rounded-xl transition-all active:scale-95 group ${permission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
              title={permission === 'granted' ? 'Notifications activées' : 'Activer les notifications'}
            >
              <Bell className="w-5 h-5 flex-shrink-0" />
              {permission === 'default' && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary border-2 border-card" />
              )}
            </button>
            <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-tight">{user?.prenom}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-inner active:scale-95 transition-transform cursor-pointer">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-6 scroll-smooth">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 min-h-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden glass border-t border-border/50 px-4 pt-2 pb-[calc(var(--safe-area-bottom)+8px)] z-40 flex items-center justify-around shadow-lg shadow-black/5">
          {NAV_ITEMS.slice(0, 4).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 transition-all btn-active-scale ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-primary/10 shadow-inner' : ''}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  </div>
                  <span className={`text-[9px] text-center leading-[1.1] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {item.label === 'Tableau de bord' ? 'Accueil' : item.label.replace('Enquête ', '')}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <NavLink
            to={ROUTE_PATHS.HISTORIQUE}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-all btn-active-scale ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-primary/10 shadow-inner' : ''}`}>
                  <History className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                </div>
                <span className={`text-[9px] text-center leading-[1.1] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  Historique
                </span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
      <Toaster position="top-right" richColors expand={false} />
    </div>
  );
}
