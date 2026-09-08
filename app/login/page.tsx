'use client';

import { useState, useEffect, useRef } from 'react';
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
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Decorative blurred orbs */}
      <div className="absolute top-1/4 -left-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-64 w-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 lg:px-12 h-16 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">ProFlow</span>
        </div>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
              Connectez-vous à <span className="text-primary">ProFlow</span>
            </h1>
            <p className="text-muted-foreground">
              Accédez à votre espace de gestion de projets selon votre rôle.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 lg:p-8 shadow-sm">
            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2.5">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Comptes de démonstration
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Demo accounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const demoUser = users.find((u) => u.email.toLowerCase() === acc.email.toLowerCase());
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={demoLoading !== null}
                    onClick={() => handleDemoLogin(acc)}
                    className="group text-left flex items-center gap-3 rounded-xl border border-border bg-background/60 hover:border-primary/50 hover:bg-primary/5 transition-colors p-3 disabled:opacity-60"
                  >
                    <div className="flex-shrink-0">
                      <UserAvatar user={demoUser} size="md" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {demoLoading === acc.role ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
                        ) : (
                          demoUser?.name ?? acc.email
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RoleBadge role={acc.role} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {acc.email} · {acc.password}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Prototype frontend — les comptes et données sont fictifs.
          </p>
        </motion.div>
      </div>
    </div>
  );
}