'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, Shield, Briefcase, User as UserIcon, Wrench } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { RoleBadge } from '@/components/shared/badges';
import type { Role } from '@/types';

const roles: {
  role: Role;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}[] = [
  { role: 'admin',    name: 'Sophie Laurent',    desc: 'Gère tous les projets, valide et assigne', icon: Shield,      bg: 'bg-destructive/10',   text: 'text-destructive' },
  { role: 'manager',  name: 'Karim Benali',      desc: 'Découpe les projets en sous-tâches, assigne', icon: Briefcase, bg: 'bg-success/10',      text: 'text-success' },
  { role: 'employee', name: 'Thomas Dubois',     desc: 'Exécute ses tâches et met à jour le statut', icon: Wrench,    bg: 'bg-chart-5/10',       text: 'text-chart-5' },
  { role: 'client',   name: 'Camille Rousseau',  desc: 'Soumet et suit ses projets', icon: UserIcon,             bg: 'bg-info/10',       text: 'text-info' },
];

export default function Home() {
  const { setRole, users } = useApp();
  const router = useRouter();

  const handleSelect = (role: Role) => {
    setRole(role);
    router.push('/dashboard');
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
        <span className="text-sm text-muted-foreground">Plateforme de gestion de projets</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Multi-rôles · Suivi en temps réel · Gantt & courbes d'avancement
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Gérez vos projets <span className="text-primary">en équipe</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Choisissez un rôle pour explorer la plateforme. Chaque rôle dispose de son propre dashboard, de ses vues et de ses permissions.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl w-full">
          {roles.map((r, i) => {
            const user = users.find((u) => u.role === r.role);
            return (
              <motion.button
                key={r.role}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                whileHover={{ y: -4 }}
                onClick={() => handleSelect(r.role)}
                className="group relative overflow-hidden rounded-xl bg-card border border-border p-6 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-lg ${r.bg} ${r.text} mb-4`}>
                  <r.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="mb-2">
                  <RoleBadge role={r.role} />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1">{user?.name ?? r.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  Entrer <ArrowRight className="h-4 w-4" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        ProFlow — Prototype frontend avec données mockées
      </footer>
    </div>
  );
}
