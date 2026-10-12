<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\ProjectStatusLog;
use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Projects')]
class ProjectController extends AbstractController
{
    private function parseOptionalDate(mixed $value, ?\DateTimeImmutable $default = null): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return $default;
        }

        try {
            return new \DateTimeImmutable((string) $value);
        } catch (\Exception) {
            throw new \InvalidArgumentException('Date de projet invalide.');
        }
    }

    #[Route('/api/projects', name: 'api_projects_list', methods: ['GET'])]
    #[OA\Response(
        response: 200,
        description: 'Liste de tous les projets.',
        content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Project'))
    )]
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
                'startDate' => $p->getStartDate()?->format(\DateTimeInterface::ATOM),
                'endDate' => $p->getEndDate()?->format(\DateTimeInterface::ATOM),
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
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['title'],
            properties: [
                new OA\Property(property: 'title', type: 'string', example: 'Refonte site vitrine'),
                new OA\Property(property: 'description', type: 'string', example: 'Refonte complète du site marketing.'),
                new OA\Property(property: 'priority', type: 'string', enum: ['low', 'medium', 'high'], example: 'medium'),
                new OA\Property(property: 'budget', type: 'integer', example: 5000),
                new OA\Property(property: 'startDate', type: 'string', format: 'date-time', description: 'Défaut : maintenant.'),
                new OA\Property(property: 'endDate', type: 'string', format: 'date-time', description: 'Défaut : +30 jours.'),
                new OA\Property(property: 'category', type: 'string', example: 'web'),
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: "Projet créé avec le statut `pending`. Le client authentifié devient automatiquement membre.",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'id', type: 'integer'),
                new OA\Property(property: 'title', type: 'string'),
                new OA\Property(property: 'description', type: 'string'),
                new OA\Property(property: 'status', type: 'string', example: 'pending'),
                new OA\Property(property: 'priority', type: 'string'),
                new OA\Property(property: 'budget', type: 'integer'),
                new OA\Property(property: 'progress', type: 'integer', example: 0),
                new OA\Property(property: 'startDate', type: 'string', format: 'date-time', nullable: true),
                new OA\Property(property: 'endDate', type: 'string', format: 'date-time', nullable: true),
                new OA\Property(property: 'category', type: 'string'),
                new OA\Property(property: 'createdAt', type: 'string', format: 'date-time'),
                new OA\Property(property: 'members', type: 'array', items: new OA\Items(ref: '#/components/schemas/ProjectMemberEntry')),
            ]
        )
    )]
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
        $project->setStartDate($this->parseOptionalDate($data['startDate'] ?? null, new \DateTimeImmutable()));
        $project->setEndDate($this->parseOptionalDate($data['endDate'] ?? null, (new \DateTimeImmutable())->modify('+30 days')));
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

        // Keep the relational ProjectMember table synchronized with the JSON
        // members field used by the existing frontend.
        $projectMember = new \App\Entity\ProjectMember();
        $projectMember->setProject($project);
        $projectMember->setUser($client);
        $projectMember->setRole('client');
        $em->persist($projectMember);

        $statusLog = new ProjectStatusLog();
        $statusLog->setProject($project);
        $statusLog->setFromStatus(null);
        $statusLog->setToStatus('pending');
        $statusLog->setActor($client);

        $em->persist($project);
        $em->persist($statusLog);
        $em->flush();

        return $this->json([
            'id' => $project->getId(),
            'title' => $project->getTitle(),
            'description' => $project->getDescription(),
            'status' => $project->getStatus(),
            'priority' => $project->getPriority(),
            'budget' => $project->getBudget(),
            'progress' => $project->getProgress(),
            'startDate' => $project->getStartDate()?->format(\DateTimeInterface::ATOM),
            'endDate' => $project->getEndDate()?->format(\DateTimeInterface::ATOM),
            'category' => $project->getCategory(),
            'createdAt' => $project->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'members' => $project->getMembers(),
        ], 201);
    }

    #[Route('/api/projects/{id}/status', name: 'api_projects_status', methods: ['PATCH'])]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), description: 'Identifiant du projet.')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['status'],
            properties: [
                new OA\Property(property: 'status', type: 'string', enum: ['pending', 'validated', 'assigned', 'in_progress', 'completed', 'rejected']),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Statut mis à jour.',
        content: new OA\JsonContent(properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'status', type: 'string'),
        ])
    )]
    #[OA\Response(response: 400, description: 'Statut invalide.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    #[OA\Response(response: 403, description: "Non autorisé (réservé à l'admin ou au chef de projet assigné).", content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    #[OA\Response(response: 404, description: 'Projet introuvable.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    public function updateStatus(
        int $id,
        Request $request,
        ProjectRepository $projectRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $project = $projectRepository->find($id);
        if (!$project) return $this->json(['message' => 'Projet introuvable.'], 404);

        $isAdmin = in_array('ROLE_ADMIN', $currentUser->getRoles(), true);
        $isManager = $project->getManager()?->getId() === $currentUser->getId();
        if (!$isAdmin && !$isManager) return $this->json(['message' => 'Non autorisé.'], 403);

        $data = json_decode($request->getContent(), true);
        $status = (string) ($data['status'] ?? '');
        $allowed = ['pending', 'validated', 'assigned', 'in_progress', 'completed', 'rejected'];
        if (!in_array($status, $allowed, true)) return $this->json(['message' => 'Statut invalide.'], 400);

        $log = new ProjectStatusLog();
        $log->setProject($project);
        $log->setFromStatus($project->getStatus());
        $log->setToStatus($status);
        $log->setActor($currentUser);
        $project->setStatus($status);
        $em->persist($log);
        $em->flush();

        return $this->json(['id' => $project->getId(), 'status' => $project->getStatus()]);
    }

    #[Route('/api/projects/{id}/members', name: 'api_projects_add_member', methods: ['POST'])]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), description: 'Identifiant du projet.')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['userId'],
            properties: [
                new OA\Property(property: 'userId', type: 'string', description: "Id numérique ou e-mail de l'utilisateur.", example: '12'),
                new OA\Property(property: 'role', type: 'string', enum: ['membre', 'chef_de_projet', 'client'], example: 'membre'),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Membre ajouté au champ JSON `members` du projet.',
        content: new OA\JsonContent(properties: [
            new OA\Property(property: 'message', type: 'string'),
            new OA\Property(property: 'members', type: 'array', items: new OA\Items(ref: '#/components/schemas/ProjectMemberEntry')),
        ])
    )]
    #[OA\Response(response: 400, description: "Données invalides, utilisateur ou rôle manquant/invalide.", content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    #[OA\Response(response: 403, description: 'Non autorisé.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    #[OA\Response(response: 404, description: 'Projet ou utilisateur introuvable.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    #[OA\Response(response: 409, description: 'Utilisateur déjà membre du projet.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    public function addMember(
        int $id,
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

        $member = ctype_digit($userId) ? $userRepository->find((int) $userId) : $userRepository->findOneBy(['email' => $userId]);
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
    #[OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), description: 'Identifiant du projet.')]
    #[OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'), description: "Identifiant de l'utilisateur à retirer.")]
    #[OA\Response(
        response: 200,
        description: 'Membre retiré du champ JSON `members` du projet.',
        content: new OA\JsonContent(properties: [
            new OA\Property(property: 'message', type: 'string'),
            new OA\Property(property: 'members', type: 'array', items: new OA\Items(ref: '#/components/schemas/ProjectMemberEntry')),
        ])
    )]
    #[OA\Response(response: 403, description: 'Non autorisé.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    #[OA\Response(response: 404, description: 'Projet ou membre introuvable.', content: new OA\JsonContent(ref: '#/components/schemas/ErrorMessage'))]
    public function removeMember(
        int $projectId,
        int $userId,
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