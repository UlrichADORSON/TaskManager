'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Layers, Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Veuillez renseigner votre email.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez renseigner un email valide.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">TaskFlow</span>
          </div>
        </div>

        {!success ? (
          <>
            <div>
              <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Email envoyé !</h2>
            <p className="text-sm text-muted-foreground">
              Si cette adresse correspond à un compte, un email avec un lien de réinitialisation a été envoyé.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Retour à la connexion
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
