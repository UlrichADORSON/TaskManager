'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Phone, Building2, MapPin, Briefcase, Check, X, Pencil, KeyRound, FolderKanban,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/shared/user-avatar';
import { RoleBadge } from '@/components/shared/badges';
import { specialtyMeta } from '@/lib/status';
import { useApp } from '@/lib/app-context';
import { toast } from '@/hooks/use-toast';
import type { User, Role, MemberSpecialty } from '@/types';

const SPECIALTIES: MemberSpecialty[] = ['Designer', 'DevOps', 'Frontend', 'Backend', 'Fullstack', 'QA', 'Chef de projet junior', 'Autre'];

interface MemberProfileDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

export function MemberProfileDialog({ user, open, onOpenChange, canEdit = false }: MemberProfileDialogProps) {
  const { users, projects, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', address: '', bio: '',
    role: 'membre' as Role, memberSpecialty: '' as MemberSpecialty | '', password: '',
  });

  useEffect(() => {
    if (open && user) {
      setEditing(false);
      setForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        company: user.company ?? '',
        address: user.address ?? '',
        bio: user.bio ?? '',
        role: user.role,
        memberSpecialty: user.memberSpecialty ?? '',
        password: '',
      });
    }
  }, [open, user]);

  const fresh = open ? (users.find((u) => u.id === user?.id) ?? user) : null;
  const view: User | undefined = fresh ?? user ?? undefined;

  const memberProjects = (fresh ? projects.filter((p) =>
    fresh.role === 'client'
      ? p.clientId === fresh.id
      : p.members.some((m) => m.userId === fresh.id) || p.managerId === fresh.id
  ) : []);

  const editable = canEdit && !!view && (view.role === 'membre' || view.role === 'chef_de_projet');

  const handleSave = () => {
    if (!user) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Champs requis', description: 'Le nom et l\u2019email sont obligatoires.', variant: 'destructive' });
      return;
    }
    updateUser(user.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      address: form.address.trim() || undefined,
      bio: form.bio.trim() || undefined,
      role: form.role,
      memberSpecialty: form.role === 'membre' && form.memberSpecialty ? (form.memberSpecialty as MemberSpecialty) : undefined,
      password: form.password.trim() || undefined,
    });
    setEditing(false);
    toast({ title: 'Profil mis à jour', description: 'Les informations du membre ont été enregistrées.' });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onOpenChange(false); setEditing(false); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserAvatar user={view} size="sm" /> Profil du membre
          </DialogTitle>
        </DialogHeader>

        {!view ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Membre introuvable.</p>
        ) : (
          <div className="space-y-4 py-2">
            {/* Identity header */}
            <div className="flex items-center gap-4">
              <UserAvatar user={view} size="xl" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-lg truncate">{view.name}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <RoleBadge role={view.role} />
                  {view.memberSpecialty && (
                    <span className="text-xs text-muted-foreground">{specialtyMeta[view.memberSpecialty]?.label ?? view.memberSpecialty}</span>
                  )}
                </div>
              </div>
              {editable && !editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
                </Button>
              )}
              {editable && editing && (
                <p className="text-xs text-muted-foreground">Mode édition</p>
              )}
            </div>

            {!editing ? (
              <>
                {/* Contact info */}
                <div className="space-y-2">
                  {view.memberSpecialty && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{specialtyMeta[view.memberSpecialty]?.label ?? view.memberSpecialty}</span>
                    </div>
                  )}
                  {view.email && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a href={`mailto:${view.email}`} className="truncate hover:text-primary hover:underline">{view.email}</a>
                    </div>
                  )}
                  {view.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a href={`tel:${view.phone.replace(/\s/g, '')}`}>{view.phone}</a>
                    </div>
                  )}
                  {view.company && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{view.company}</span>
                    </div>
                  )}
                  {view.address && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{view.address}</span>
                    </div>
                  )}
                </div>

                {view.bio && (
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/40">{view.bio}</p>
                )}

                {memberProjects.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" /> Projets ({memberProjects.length})
                    </p>
                    <div className="space-y-1.5">
                      {memberProjects.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                          <span className="truncate">{p.title}</span>
                        </div>
                      ))}
                      {memberProjects.length > 5 && (
                        <p className="text-xs text-muted-foreground">+ {memberProjects.length - 5} autres projets</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                    <KeyRound className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Vous pouvez modifier les informations de ce membre. Laissez le mot de passe vide pour ne pas le changer.</p>
                  </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto scrollbar-thin pr-1">
                  <div>
                    <Label>Nom complet *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Rôle</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membre">Membre</SelectItem>
                        <SelectItem value="chef_de_projet">Chef de projet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.role === 'membre' && (
                    <div>
                      <Label>Spécialité</Label>
                      <Select value={form.memberSpecialty || undefined} onValueChange={(v) => setForm({ ...form, memberSpecialty: v as MemberSpecialty })}>
                        <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map((s) => (
                            <SelectItem key={s} value={s}>{specialtyMeta[s]?.label ?? s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Téléphone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ex: 06 12 34 56 78" />
                  </div>
                  <div>
                    <Label>Entreprise</Label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Ex: TechStart SAS" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Adresse</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Ex: 12 Rue de la Paix, 75002 Paris" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Mot de passe (laissez vide pour ne pas changer)</Label>
                    <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Nouveau mot de passe" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Bio</Label>
                    <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
              <Button onClick={handleSave} className="gap-1.5 bg-success hover:bg-success/90">
                <Check className="h-3.5 w-3.5" /> Enregistrer
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}