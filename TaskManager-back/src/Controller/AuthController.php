<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class AuthController extends AbstractController
{
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
public function me(): JsonResponse
{
    /** @var User $user */
    $user = $this->getUser();

    return $this->json([
        'id' => (string) $user->getId(),
        'email' => $user->getEmail(),
        'name' => $user->getName(),
        'roles' => $user->getRoles(),
        'avatarUrl' => $user->getAvatarUrl(),
        'phone' => $user->getPhone(),
        'company' => $user->getCompany(),
        'address' => $user->getAddress(),
        'bio' => $user->getBio(),
        'memberSpecialty' => $user->getMemberSpecialty(),
        'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
    ]);
}

#[Route('/api/me', name: 'api_me_update', methods: ['PATCH'])]
public function updateMe(Request $request, EntityManagerInterface $em): JsonResponse
{
    /** @var User $user */
    $user = $this->getUser();
    $data = json_decode($request->getContent(), true);

    if (isset($data['name'])) {
        $user->setName($data['name']);
    }
    if (isset($data['phone'])) {
        $user->setPhone($data['phone']);
    }
    if (isset($data['company'])) {
        $user->setCompany($data['company']);
    }
    if (isset($data['address'])) {
        $user->setAddress($data['address']);
    }
    if (isset($data['bio'])) {
        $user->setBio($data['bio']);
    }
    if (isset($data['avatarUrl'])) {
        $user->setAvatarUrl($data['avatarUrl']);
    }

    $em->flush();

    return $this->json([
        'id' => (string) $user->getId(),
        'email' => $user->getEmail(),
        'name' => $user->getName(),
        'phone' => $user->getPhone(),
        'company' => $user->getCompany(),
        'address' => $user->getAddress(),
        'bio' => $user->getBio(),
        'avatarUrl' => $user->getAvatarUrl(),
    ]);
}

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    #[IsGranted('PUBLIC_ACCESS')]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface $jwtManager,
        RefreshTokenGeneratorInterface $refreshTokenGenerator,
        RefreshTokenManagerInterface $refreshTokenManager,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            return $this->json(['message' => 'Email, mot de passe et nom sont requis'], 400);
        }

        $existing = $em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existing) {
            return $this->json(['message' => 'Un compte existe déjà avec cet email'], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name']);
        $user->setRoles(['ROLE_CLIENT']);
        $user->setAvatarUrl($data['avatarUrl'] ?? 'https://i.pravatar.cc/150?u=' . urlencode($data['email']));
        $user->setCompany($data['company'] ?? null);
        $user->setPhone($data['phone'] ?? null);
        $user->setPassword($hasher->hashPassword($user, $data['password']));

        $em->persist($user);
        $em->flush();

        $jwtToken = $jwtManager->create($user);

        $ttl = (int) $this->getParameter('gesdinet_jwt_refresh_token.ttl');
        $refreshToken = $refreshTokenGenerator->createForUserWithTtl($user, $ttl);
        $refreshTokenManager->save($refreshToken);

        return $this->json([
            'id' => (string) $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'token' => $jwtToken,
            'refresh_token' => $refreshToken->getRefreshToken(),
        ], 201);
    }
}