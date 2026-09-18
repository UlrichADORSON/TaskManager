<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

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
}