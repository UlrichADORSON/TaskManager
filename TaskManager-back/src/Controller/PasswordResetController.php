<?php

namespace App\Controller;

use App\Entity\PasswordResetToken;
use App\Repository\UserRepository;
use App\Service\PasswordResetService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class PasswordResetController extends AbstractController
{
    #[Route('/api/forgot-password', name: 'api_forgot_password', methods: ['POST'])]
    public function forgotPassword(
        Request $request,
        UserRepository $userRepository,
        PasswordResetService $passwordResetService
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $email = $data['email'] ?? null;

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'message' => 'Adresse email invalide.'
            ], 400);
        }

        $user = $userRepository->findOneBy([
            'email' => $email
        ]);

        if ($user) {
            $passwordResetService->requestPasswordReset($user);
        }

        return $this->json([
            'message' => 'Si cette adresse correspond à un compte, un email sera envoyé.'
        ]);
    }

    #[Route('/api/reset-password', name: 'api_reset_password', methods: ['POST'])]
    public function resetPassword(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $token = $data['token'] ?? null;
        $password = $data['password'] ?? null;

        if (!$token || !$password || strlen($password) < 6) {
            return $this->json(['message' => 'Token et mot de passe valides sont requis'], 400);
        }

        $hashedToken = hash('sha256', $token);
        $resetToken = $em->getRepository(PasswordResetToken::class)->findOneBy([
            'token' => $hashedToken,
        ]);

        if (!$resetToken || $resetToken->getExpiresAt() < new \DateTimeImmutable()) {
            return $this->json(['message' => 'Token invalide ou expiré'], 400);
        }

        $user = $resetToken->getUser();
        $user->setPassword($hasher->hashPassword($user, $password));

        $em->remove($resetToken);
        $em->flush();

        return $this->json(['message' => 'Mot de passe réinitialisé avec succès']);
    }
}