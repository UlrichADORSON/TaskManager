<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

class ProjectController extends AbstractController
{
    #[Route('/api/projects', name: 'api_projects_list', methods: ['GET'])]
    public function list(ProjectRepository $projectRepository): JsonResponse
    {
        $projects = $projectRepository->findAll();
        $data = array_map(function (Project $p) {
            return [
                'id' => $p->getId(),
                'title' => $p->getTitle(),
                'description' => $p->getDescription(),
                'status' => $p->getStatus(),
                'priority' => $p->getPriority(),
                'budget' => $p->getBudget(),
                'progress' => $p->getProgress(),
                'category' => $p->getCategory(),
                'createdAt' => $p->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                'client' => $p->getClient() ? [
                    'id' => $p->getClient()->getId(),
                    'name' => $p->getClient()->getName(),
                    'email' => $p->getClient()->getEmail(),
                ] : null,
                'manager' => $p->getManager() ? [
                    'id' => $p->getManager()->getId(),
                    'name' => $p->getManager()->getName(),
                    'email' => $p->getManager()->getEmail(),
                ] : null,
                'members' => $p->getMembers() ?? [],
            ];
        }, $projects);

        return $this->json($data);
    }

    #[Route('/api/projects', name: 'api_projects_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $client */
        $client = $this->getUser();

        $data = json_decode($request->getContent(), true);

        $project = new Project();
        $project->setTitle($data['title'] ?? '');
        $project->setDescription($data['description'] ?? '');
        $project->setStatus('pending');
        $project->setPriority($data['priority'] ?? 'medium');
        $project->setBudget((int) ($data['budget'] ?? 0));
        $project->setProgress(0);
        $project->setCategory($data['category'] ?? '');
        $project->setClient($client);

        // Initialize members with the client
        $members = [
            [
                'userId' => (string) $client->getId(),
                'role' => 'client',
                'joinedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            ],
        ];
        $project->setMembers($members);

        $em->persist($project);
        $em->flush();

        return $this->json([
            'id' => $project->getId(),
            'title' => $project->getTitle(),
            'description' => $project->getDescription(),
            'status' => $project->getStatus(),
            'priority' => $project->getPriority(),
            'budget' => $project->getBudget(),
            'progress' => $project->getProgress(),
            'category' => $project->getCategory(),
            'createdAt' => $project->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'members' => $project->getMembers(),
        ], 201);
    }

    #[Route('/api/projects/{id}/members', name: 'api_projects_add_member', methods: ['POST'])]
    public function addMember(
        mixed $id,
        Request $request,
        ProjectRepository $projectRepository,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $projectId = (int) $id;
        $project = $projectRepository->find($projectId);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        // Vérifier les permissions : admin, client du projet, ou chef_de_projet déjà membre
        $isAdmin = in_array('ROLE_ADMIN', $currentUser->getRoles(), true);
        $isClient = $project->getClient()?->getId() === $currentUser->getId();
        $isManager = $project->getManager()?->getId() === $currentUser->getId();
        $members = $project->getMembers() ?? [];
        $isMember = false;
        foreach ($members as $m) {
            if (($m['userId'] ?? '') === (string) $currentUser->getId()) {
                $isMember = true;
                break;
            }
        }
        $isProjectMember = $isClient || $isManager || $isMember;
        if (!$isAdmin && !$isProjectMember) {
            return $this->json(['message' => 'Non autorisé.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Données JSON invalides.'], 400);
        }

        $userId = (string) ($data['userId'] ?? '');
        $role = (string) ($data['role'] ?? 'membre');

        if ($userId === '') {
            return $this->json(['message' => 'L\'utilisateur est obligatoire.'], 400);
        }

        $member = $userRepository->find((int) $userId);
        if (!$member) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $allowedRoles = ['membre', 'chef_de_projet', 'client'];
        if (!in_array($role, $allowedRoles, true)) {
            return $this->json(['message' => 'Rôle invalide.'], 400);
        }

        $members = $project->getMembers() ?? [];
        foreach ($members as $existingMember) {
            if (($existingMember['userId'] ?? '') === $userId) {
                return $this->json(['message' => 'Cet Utilisateur est déjà un membre du projet.'], 409);
            }
        }

        $members[] = [
            'userId' => $userId,
            'role' => $role,
            'joinedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ];

        $project->setMembers($members);
        $em->flush();

        return $this->json([
            'message' => 'Membre ajouté avec succès.',
            'members' => $members,
        ], 200);
    }

    #[Route('/api/projects/{projectId}/members/{userId}', name: 'api_projects_remove_member', methods: ['DELETE'])]
    public function removeMember(
        mixed $projectId,
        mixed $userId,
        ProjectRepository $projectRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $projId = (int) $projectId;
        $uid = (string) $userId;
        $project = $projectRepository->find($projId);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        // Vérifier les permissions : admin, client du projet, ou chef_de_projet déjà membre
        $isAdmin = in_array('ROLE_ADMIN', $currentUser->getRoles(), true);
        $isClient = $project->getClient()?->getId() === $currentUser->getId();
        $isManager = $project->getManager()?->getId() === $currentUser->getId();
        $members = $project->getMembers() ?? [];
        $isMember = false;
        foreach ($members as $m) {
            if (($m['userId'] ?? '') === (string) $currentUser->getId()) {
                $isMember = true;
                break;
            }
        }
        $isProjectMember = $isClient || $isManager || $isMember;
        if (!$isAdmin && !$isProjectMember) {
            return $this->json(['message' => 'Non autorisé.'], 403);
        }

        $members = $project->getMembers() ?? [];
        $newMembers = array_filter($members, function ($m) use ($uid) {
            return ($m['userId'] ?? '') !== $uid;
        });

        if (count($newMembers) === count($members)) {
            return $this->json(['message' => 'Membre non trouvé.'], 404);
        }

        $project->setMembers(array_values($newMembers));
        $em->flush();

        return $this->json([
            'message' => 'Membre retiré avec succès.',
            'members' => $project->getMembers(),
        ], 200);
    }
}