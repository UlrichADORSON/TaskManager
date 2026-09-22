'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon, Shield, Briefcase, Wrench, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-provider';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/shared/user-avatar';
import { RoleBadge } from '@/components/shared/badges';
import type { Role } from '@/types';

const demoAccounts: {
  role: Role;
  email: string;
  password: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  { role: 'admin',         email: 'sophie.laurent@proflow.io', password: 'admin123',   desc: 'Gère tous les projets',            icon: Shield,    accent: 'text-destructive' },
  { role: 'chef_de_projet',email: 'karim.benali@proflow.io',  password: 'manager123', desc: 'Chef de projet — pilote les projets', icon: Briefcase, accent: 'text-primary' },
  { role: 'membre',        email: 'thomas.dubois@proflow.io', password: 'employe123', desc: 'Membre — exécute les sous-tâches',   icon: Wrench,    accent: 'text-info' },
  { role: 'client',        email: 'camille@techstart.fr',     password: 'client123',  desc: 'Soumet et suit ses projets',        icon: UserIcon,  accent: 'text-chart-5' },
];

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, login, users } = useApp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<Role | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (currentUser && mounted) router.replace('/dashboard');
  }, [currentUser, mounted, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }
    setLoading(true);
    // Simulate a short network round-trip for the demo
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (ok) {
        router.push('/dashboard');
      } else {
        setEmail('');
        setPassword('');
        setError('Email ou mot de passe incorrect. Consultez les comptes de démonstration ci-dessous.');
      }
    }, 500);
  };

  const handleDemoLogin = (account: (typeof demoAccounts)[number]) => {
    setError('');
    setDemoLoading(account.role);
    setTimeout(() => {
      const ok = login(account.email, account.password);
      setDemoLoading(null);
      if (ok) router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/10 overflow-hidden">
      {/* Left pane - Image & branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 flex-col justify-between p-10 xl:p-12">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=2070&auto=format&fit=crop"
            alt="Mountain lake landscape"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary shadow-soft-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">TaskFlow</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-5 leading-tight">
            Organisez vos idées, réalisez vos projets.
          </h1>
          <p className="text-lg text-white/80">
            Une plateforme moderne et intuitive pour gérer vos tâches efficacement, conçue pour les équipes exigeantes.
          </p>
        </div>
      </div>

      {/* Right pane - Login form */}
      <div className="flex-1 flex flex-col relative max-h-screen overflow-y-auto">
        <header className="absolute top-0 right-0 p-4 flex justify-end w-full">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1.5">Se connecter</h2>
              <p className="text-sm text-muted-foreground">Accédez à votre espace de travail.</p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    className="pl-9 h-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-9 h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5" defaultChecked />
                    <span>Se souvenir de moi</span>
                  </label>
                  <a href="#" className="text-xs font-medium text-primary hover:underline">Mot de passe oublié ?</a>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2 animate-in fade-in zoom-in-95 duration-200">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-10 shadow-soft-lg group relative overflow-hidden" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
                {!loading && <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium tracking-wider">
                  Comptes de démonstration
                </span>
              </div>
            </div>

            {/* Demo accounts */}
            <div className="grid grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const demoUser = users.find((u) => u.email.toLowerCase() === acc.email.toLowerCase());
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={demoLoading !== null}
                    onClick={() => handleDemoLogin(acc)}
                    className="group text-left flex items-center gap-2.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 hover:shadow-soft-lg transition-all duration-300 p-2.5 disabled:opacity-60"
                  >
                    <div className="flex-shrink-0">
                      <UserAvatar user={demoUser} size="sm" className="shadow-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors leading-tight">
                        {demoLoading === acc.role ? (
                          <Loader2 className="h-3 w-3 animate-spin inline" />
                        ) : (
                          demoUser?.name ?? acc.email
                        )}
                      </p>
                      <div className="mt-0.5">
                        <RoleBadge role={acc.role} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-6">
              Pas encore de compte ? <a href="#" className="text-primary hover:underline font-medium">Créer un compte</a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}