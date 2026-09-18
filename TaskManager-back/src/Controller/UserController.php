<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class UserController extends AbstractController
{
    #[Route('/api/users', name: 'api_users_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json([
                'message' => 'Données JSON invalides.'
            ], 400);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        $role = (string) ($data['role'] ?? 'membre');

        // Validation des champs obligatoires
        if ($name === '' || $email === '' || $password === '') {
            return $this->json([
                'message' => 'Le nom, l’email et le mot de passe sont obligatoires.'
            ], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'message' => 'Adresse email invalide.'
            ], 400);
        }

        if (strlen($password) < 8) {
            return $this->json([
                'message' => 'Le mot de passe doit contenir au moins 8 caractères.'
            ], 400);
        }

        // Rôles autorisés
        $allowedRoles = [
            'membre' => 'ROLE_MEMBRE',
            'chef_de_projet' => 'ROLE_CHEF_DE_PROJET',
        ];

        if (!isset($allowedRoles[$role])) {
            return $this->json([
                'message' => 'Rôle invalide.'
            ], 400);
        }

        // Vérifier si l’email existe déjà
        $existingUser = $em->getRepository(User::class)
            ->findOneBy(['email' => $email]);

        if ($existingUser) {
            return $this->json([
                'message' => 'Cet email est déjà utilisé.'
            ], 409);
        }

        $user = new User();

        $user->setName($name);
        $user->setEmail($email);
        $user->setRoles([$allowedRoles[$role]]);

        $user->setPassword(
            $hasher->hashPassword($user, $password)
        );

        $user->setAvatarUrl(
            $data['avatarUrl'] ?? 'https://i.pravatar.cc/150'
        );

        $user->setMemberSpecialty(
            $role === 'membre'
                ? ($data['memberSpecialty'] ?? null)
                : null
        );

        $user->setPhone($data['phone'] ?? null);
        $user->setCompany($data['company'] ?? null);
        $user->setAddress($data['address'] ?? null);
        $user->setBio($data['bio'] ?? null);

        try {
            $em->persist($user);
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json([
                'message' => 'Cet email est déjà utilisé.'
            ], 409);
        }

        return $this->json([
            'id' => (string) $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $role,
            'memberSpecialty' => $user->getMemberSpecialty(),
            'avatarUrl' => $user->getAvatarUrl(),
            'phone' => $user->getPhone(),
            'company' => $user->getCompany(),
            'address' => $user->getAddress(),
            'bio' => $user->getBio(),
            'createdAt' => $user->getCreatedAt()?->format(
                \DateTimeInterface::ATOM
            ),
        ], 201);
    }
}