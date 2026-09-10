'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Phone, UserPlus, Upload, X, Building2, MapPin, KeyRound, ArrowUpRight, Search, Briefcase } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { RoleBadge } from '@/components/shared/badges';
import { MemberProfileDialog } from '@/components/shared/member-profile-dialog';
import { specialtyMeta } from '@/lib/status';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { MemberSpecialty, User } from '@/types';

export default function EmployeesPage() {
  const user = useAuthGuard();
  const { users, projects, addEmployee, specialties, addSpecialty } = useApp();
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [posteOpen, setPosteOpen] = useState(false);
  const [posteName, setPosteName] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'membre' as 'chef_de_projet' | 'membre',
    memberSpecialty: 'Designer' as MemberSpecialty,
  });
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'chef_de_projet';

  const visibleUsers = useMemo(() => {
    try {
      if (!user) return [];
      const q = debouncedSearch.trim().toLowerCase();
      let list = users.filter((u) => u.role === 'membre' || u.role === 'chef_de_projet');
      if (specialtyFilter !== 'all') list = list.filter((u) => u.memberSpecialty === specialtyFilter);
      if (q) list = list.filter((u) => u.name.toLowerCase().includes(q) || (u.memberSpecialty ?? '').toLowerCase().includes(q));
      return list;
    } catch {
      return [];
    }
  }, [user, users, specialtyFilter, debouncedSearch]);

  const teamStats = useMemo(() => {
    const team = users.filter((u) => u.role === 'membre' || u.role === 'chef_de_projet');
    const byUser: Record<string, { total: number; done: number; active: number }> = {};
    projects.forEach((p) => {
      p.subtasks.forEach((st) => {
        if (!st.assignedToId) return;
        const rec = byUser[st.assignedToId] ?? { total: 0, done: 0, active: 0 };
        rec.total += 1;
        if (st.status === 'done') rec.done += 1;
        if (st.status === 'in_progress' || st.status === 'review') rec.active += 1;
        byUser[st.assignedToId] = rec;
      });
    });
    const activePersons = team.filter((u) => (byUser[u.id]?.active ?? 0) > 0).length;
    const activeTasks = team.reduce((acc, u) => acc + (byUser[u.id]?.active ?? 0), 0);
    return { byUser, activePersons, activeTasks, teamCount: team.length };
  }, [users, projects]);

  if (!user) return null;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleAddMember = () => {
    if (!form.name || !form.email || !form.password) return;
    addEmployee({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      role: form.role,
      memberSpecialty: form.role === 'membre' ? form.memberSpecialty : undefined,
      avatarUrl: photoPreview,
    });
    setAddOpen(false);
    setForm({ name: '', email: '', password: '', phone: '', role: 'membre', memberSpecialty: 'Designer' });
    setPhotoPreview(undefined);
  };

  const handleAddPoste = () => {
    if (!posteName.trim()) return;
    addSpecialty(posteName);
    setSpecialtyFilter(posteName.trim());
    setPosteOpen(false);
    setPosteName('');
  };

  const stats = [
    { badge: 'Équipe', badgeCls: 'bg-primary/10 text-primary', value: teamStats.teamCount, label: 'membres & chefs de projet' },
    { badge: 'En activité', badgeCls: 'bg-success/10 text-success', value: teamStats.activePersons, label: 'personnes en charge de tâches en cours' },
    { badge: 'En cours', badgeCls: 'bg-warning/10 text-warning', value: teamStats.activeTasks, label: 'tâches en cours ou en révision' },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight leading-none">Équipe<span className="text-primary"> ·</span></h2>
          <p className="text-sm text-muted-foreground mt-2">
            {visibleUsers.length} membre{visibleUsers.length > 1 ? 's' : ''} affiché{visibleUsers.length > 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-col items-end gap-2">
            <Button onClick={() => setAddOpen(true)} className="rounded-full gap-1.5 shadow-[0_8px_20px_rgba(46,152,255,0.35)]">
              <UserPlus className="h-4 w-4" /> Ajouter un membre
            </Button>
            <Button
              variant="outline"
              onClick={() => setPosteOpen(true)}
              className="rounded-full gap-1.5 border-primary/25 bg-card text-foreground hover:bg-primary/5 hover:border-primary/40 shadow-[0_6px_18px_rgba(46,152,255,0.12)]"
            >
              <Briefcase className="h-4 w-4" /> Créer un poste
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.badge} className="relative overflow-hidden rounded-[24px] bg-card border border-border/60 shadow-card p-6">
            <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <span className={cn('relative inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest', s.badgeCls)}>
              {s.badge}
            </span>
            <p className="relative mt-4 font-display text-5xl font-bold tracking-tight leading-none">{s.value}</p>
            <p className="relative mt-2.5 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres en capsules */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-8">
        <div className="relative w-full lg:w-[560px] lg:shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            name="employee-search"
            placeholder="Rechercher une personne ou un poste…"
            className="w-full h-12 pl-12 pr-10 rounded-full bg-card border border-border/60 text-sm text-foreground caret-primary shadow-card outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap py-1 pr-1 -mx-1 px-1 scrollbar-thin">
          {['all', ...specialties].map((s) => {
            const active = specialtyFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSpecialtyFilter(s)}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-semibold transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(46,152,255,0.35)]'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40'
                )}
              >
                {s === 'all' ? 'Toutes' : (specialtyMeta[s]?.label ?? s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section membres */}
      {visibleUsers.length === 0 ? (
        <div className="text-center py-16 rounded-[24px] bg-card border border-border/60 shadow-card text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucune personne trouvée.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="font-display text-lg font-bold tracking-tight">Membres de l’équipe</h3>
              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {visibleUsers.length}
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">Cliquer sur une carte pour ouvrir le profil</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {visibleUsers.map((u, i) => {
                const stats = teamStats.byUser[u.id];
                const total = stats?.total ?? 0;
                const done = stats?.done ?? 0;
                const active = stats?.active ?? 0;
                const ratio = total ? done / total : 0;
                const filled = total ? Math.max(1, Math.round(ratio * 5)) : 0;
                const dotColor = ratio >= 0.75 ? 'bg-success' : ratio >= 0.4 ? 'bg-warning' : 'bg-destructive';
                return (
                  <motion.div
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <Card
                      className="group relative cursor-pointer overflow-hidden rounded-[24px] border-border/60 bg-card p-6 shadow-card hover:-translate-y-1 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                      <div className="flex items-start gap-4">
                        <UserAvatar user={u} className="h-16 w-16 rounded-[20px] shadow-soft-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="font-display font-semibold text-[15px] leading-tight truncate group-hover:text-primary transition-colors">{u.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <RoleBadge role={u.role} />
                            {(u.role === 'membre' || u.role === 'chef_de_projet') && u.memberSpecialty && (
                              <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                {specialtyMeta[u.memberSpecialty]?.label ?? u.memberSpecialty}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="relative flex items-center justify-center h-9 w-9 rounded-full border border-border/70 bg-white/60 text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/5 flex-shrink-0 transition-all">
                          <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                      </div>

                      <div className="mt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Contacts</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={`mailto:${u.email}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 max-w-[200px] transition-colors"
                          >
                            <Mail className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{u.email}</span>
                          </a>
                          {u.phone && (
                            <a
                              href={`tel:${u.phone.replace(/\s/g, '')}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              <Phone className="h-3 w-3" /> {u.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {(u.company || u.address) && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {u.company && (
                            <>
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{u.company}</span>
                            </>
                          )}
                          {u.company && u.address && <span className="text-muted-foreground/50">·</span>}
                          {u.address && (
                            <>
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{u.address}</span>
                            </>
                          )}
                        </p>
                      )}

                      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Activité</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <span
                                key={i}
                                className={cn('h-2 w-2 rounded-full transition-colors', i < filled ? (total > 0 ? dotColor : 'bg-border') : 'bg-border')}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {total ? `${done}/${total} terminée${done > 1 ? 's' : ''}${active > 0 ? ` · ${active} en cours` : ''}` : 'Aucune tâche'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Ajouter un membre et créer son compte
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
              <KeyRound className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                En ajoutant un membre, vous créez son compte (email + mot de passe). Il pourra ensuite se connecter à la plateforme. Vous pouvez aussi définir manuellement sa spécialité.
              </p>
            </div>

            {/* Photo upload */}
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative group">
                  <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted/30 flex items-center justify-center">
                    <img src={photoPreview} alt="Photo" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(undefined)}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center transition-colors shadow-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="h-20 w-20 rounded-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Photo</span>
                </button>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Photo de profil</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG.</p>
                <Button type="button" variant="outline" size="sm" className="mt-2 h-8 text-xs" onClick={() => photoInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> {photoPreview ? 'Changer la photo' : 'Télécharger'}
                </Button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emp-name">Nom complet *</Label>
                <Input id="emp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Marie Dupont" />
              </div>
              <div>
                <Label htmlFor="emp-email">Email *</Label>
                <Input id="emp-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="marie@entreprise.com" />
              </div>
              <div>
                <Label htmlFor="emp-password">Mot de passe *</Label>
                <Input id="emp-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe du compte" />
              </div>
              <div>
                <Label htmlFor="emp-phone">Téléphone</Label>
                <Input id="emp-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ex: 06 12 34 56 78" />
              </div>
              <div>
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as 'chef_de_projet' | 'membre' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membre">Membre du projet</SelectItem>
                    <SelectItem value="chef_de_projet">Chef de projet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role === 'membre' && (
                <div>
                  <Label>Spécialité</Label>
                  <Select value={form.memberSpecialty} onValueChange={(v) => setForm({ ...form, memberSpecialty: v as MemberSpecialty })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s} value={s}>{specialtyMeta[s]?.label ?? s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button onClick={handleAddMember} disabled={!form.name || !form.email || !form.password}>
              <UserPlus className="h-4 w-4 mr-2" /> Créer & ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create poste dialog */}
      <Dialog open={posteOpen} onOpenChange={setPosteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Créer un poste
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">
              Le poste sera ajouté au filtre de l’équipe et pourra être attribué aux membres.
            </p>
            <div>
              <Label htmlFor="poste-name">Nom du poste *</Label>
              <Input
                id="poste-name"
                value={posteName}
                onChange={(e) => setPosteName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPoste(); }}
                placeholder="Ex: Commercial, Graphiste, Référent SEO…"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPosteOpen(false); setPosteName(''); }}>Annuler</Button>
            <Button onClick={handleAddPoste} disabled={!posteName.trim()}>
              <Briefcase className="h-4 w-4 mr-2" /> Créer le poste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* Member detail dialog */}
      <MemberProfileDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(o) => { if (!o) setSelectedUser(null); }}
        canEdit={user.role === 'admin'}
      />
    </AppShell>
  );
}