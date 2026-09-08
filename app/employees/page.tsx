'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Phone, UserPlus, Upload, X, Building2, MapPin, KeyRound } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppShell } from '@/components/shared/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/shared/filter-bar';
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
import type { MemberSpecialty, User } from '@/types';

const SPECIALTIES: MemberSpecialty[] = ['Designer', 'DevOps', 'Frontend', 'Backend', 'Fullstack', 'QA', 'Chef de projet junior', 'Autre'];

export default function EmployeesPage() {
  const user = useAuthGuard();
  const { users, addEmployee } = useApp();
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'membre' as 'chef_de_projet' | 'membre',
    memberSpecialty: 'Designer' as MemberSpecialty,
  });
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'chef_de_projet';

  const visibleUsers = useMemo(() => {
    if (!user) return [];
    let list = users.filter((u) => u.role === 'membre' || u.role === 'chef_de_projet');
    if (specialtyFilter !== 'all') list = list.filter((u) => u.memberSpecialty === specialtyFilter);
    if (search) list = list.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || (u.memberSpecialty ?? '').toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [user, users, specialtyFilter, search]);

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

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Équipe</h2>
          <p className="text-sm text-muted-foreground mt-1">{visibleUsers.length} membre{visibleUsers.length > 1 ? 's' : ''} dans l’équipe</p>
        </div>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Ajouter un membre
          </Button>
        )}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une personne..."
        filters={[
          {
            key: 'specialty', value: specialtyFilter, onChange: setSpecialtyFilter,
            options: [
              { value: 'all', label: 'Toutes les spécialités' },
              ...SPECIALTIES.map((s) => ({ value: s, label: specialtyMeta[s]?.label ?? s })),
            ],
          },
        ]}
      />

      {visibleUsers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucune personne trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((u, i) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              >
                <Card className="p-5 hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer" onClick={() => setSelectedUser(u)}>
                  <div className="flex items-start gap-3">
                    <UserAvatar user={u} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.memberSpecialty ? (specialtyMeta[u.memberSpecialty]?.label ?? u.memberSpecialty) : u.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <RoleBadge role={u.role} />
                        {u.memberSpecialty && <span className="text-xs text-muted-foreground">{specialtyMeta[u.memberSpecialty]?.label}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> <span className="truncate">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {u.phone}
                      </div>
                    )}
                    {u.address && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{u.address}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
                      {SPECIALTIES.map((s) => (
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
