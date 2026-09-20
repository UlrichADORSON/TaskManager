<?php

namespace App\Service;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class PasswordResetService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MailerInterface $mailer,
        private string $frontendUrl
    ) {
    }

    public function requestPasswordReset(User $user): void
    {
        // Générer un token sécurisé
        $plainToken = bin2hex(random_bytes(32));

        // Créer le token de réinitialisation
        $resetToken = new PasswordResetToken();

        // Stocker le token hashé dans la base de données
        $resetToken->setToken(hash('sha256', $plainToken));

        // Le token expire dans une heure
        $resetToken->setExpiresAt(
            new \DateTimeImmutable('+1 hour')
        );

        // Associer le token à l'utilisateur
        $resetToken->setUser($user);

        // Enregistrer dans la base de données
        $this->entityManager->persist($resetToken);
        $this->entityManager->flush();

        $baseUrl = $this->frontendUrl ?: 'http://localhost:3000';
        $resetUrl = $baseUrl . '/reset-password?token='
            . rawurlencode($plainToken);

        // Préparer l'email
        $email = (new Email())
            ->from('hello@demomailtrap.co')
            ->to((string) $user->getEmail())
            ->subject('Réinitialisation de votre mot de passe')
            ->text(
                "Bonjour {$user->getName()},\n\n"
                . "Vous avez demandé une réinitialisation de votre mot de passe.\n\n"
                . "Cliquez sur le lien suivant pour réinitialiser votre mot de passe :\n"
                . $resetUrl . "\n\n"
                . "Ce lien expire dans 1 heure.\n\n"
                . "Si vous n'êtes pas à l'origine de cette demande, "
                . "ignorez cet email."
            )
            ->html(
                "<p>Bonjour {$user->getName()},</p>"
                . "<p>Vous avez demandé une réinitialisation de votre mot de passe.</p>"
                . "<p><a href=\"{$resetUrl}\">Cliquez ici pour réinitialiser votre mot de passe</a></p>"
                . "<p>Ce lien expire dans 1 heure.</p>"
                . "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>"
            );

        // Envoyer l'email
        $this->mailer->send($email);
    }
}