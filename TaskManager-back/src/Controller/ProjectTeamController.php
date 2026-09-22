<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\ProjectMember;
use App\Entity\User;
use App\Repository\ProjectMemberRepository;
use App\Repository\ProjectRepository;
use App\Repository\UserRepository;
use App\Service\ProjectAccessService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Équipe projet basée sur une vraie table (ProjectMember), en plus du champ
 * JSON `members` déjà présent sur Project (laissé tel quel).
 * Routes sous /team-members pour ne pas entrer en conflit avec les routes
 * existantes /api/projects/{id}/members.
 */
class ProjectTeamController extends AbstractController
{
    private function serialize(ProjectMember $pm): array
    {
        return [
            'id' => $pm->getId(),
            'role' => $pm->getRole(),
            'joinedAt' => $pm->getJoinedAt()?->format(\DateTimeInterface::ATOM),
            'user' => $pm->getUser() ? [
                'id' => $pm->getUser()->getId(),
                'name' => $pm->getUser()->getName(),
                'email' => $pm->getUser()->getEmail(),
            ] : null,
        ];
    }

    #[Route('/api/projects/{id}/team-members', name: 'api_projects_team_list', methods: ['GET'])]
    public function list(
        int $id,
        ProjectRepository $projectRepository,
        ProjectMemberRepository $projectMemberRepository,
        ProjectAccessService $access
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $project = $projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        if (!$access->canAccess($project, $user)) {
            return $this->json(['message' => 'Non autorisé.'], 403);
        }

        $members = $projectMemberRepository->findByProject($project);

        return $this->json(array_map(fn (ProjectMember $m) => $this->serialize($m), $members));
    }

    #[Route('/api/projects/{id}/team-members', name: 'api_projects_team_add', methods: ['POST'])]
    public function add(
        int $id,
        Request $request,
        ProjectRepository $projectRepository,
        UserRepository $userRepository,
        ProjectAccessService $access,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $project = $projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        $isAdmin = $access->isAdmin($currentUser);
        $isManager = $access->isManager($project, $currentUser);
        if (!$isAdmin && !$isManager) {
            return $this->json(['message' => 'Non autorisé.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Données JSON invalides.'], 400);
        }

        $userId = (string) ($data['userId'] ?? '');
        $role = (string) ($data['role'] ?? 'membre');
        $allowedRoles = ['membre', 'chef_de_projet', 'client'];

        if ($userId === '') {
            return $this->json(['message' => 'L\'utilisateur est obligatoire.'], 400);
        }
        if (!in_array($role, $allowedRoles, true)) {
            return $this->json(['message' => 'Rôle invalide.'], 400);
        }

        $member = $userRepository->find((int) $userId);
        if (!$member) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $existing = $em->getRepository(ProjectMember::class)->findOneBy([
            'project' => $project,
            'user' => $member,
        ]);
        if ($existing) {
            return $this->json(['message' => 'Cet utilisateur est déjà membre du projet.'], 409);
        }

        $projectMember = new ProjectMember();
        $projectMember->setProject($project);
        $projectMember->setUser($member);
        $projectMember->setRole($role);

        $em->persist($projectMember);
        $em->flush();

        return $this->json([
            'message' => 'Membre ajouté à l\'équipe.',
            'member' => $this->serialize($projectMember),
        ], 201);
    }

    #[Route('/api/projects/{id}/team-members/{memberId}', name: 'api_projects_team_remove', methods: ['DELETE'])]
    public function remove(
        int $id,
        int $memberId,
        ProjectRepository $projectRepository,
        ProjectMemberRepository $projectMemberRepository,
        ProjectAccessService $access,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $project = $projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        $isAdmin = $access->isAdmin($currentUser);
        $isManager = $access->isManager($project, $currentUser);
        if (!$isAdmin && !$isManager) {
            return $this->json(['message' => 'Non autorisé.'], 403);
        }

        $projectMember = $projectMemberRepository->find($memberId);
        if (!$projectMember || $projectMember->getProject()?->getId() !== $project->getId()) {
            return $this->json(['message' => 'Membre introuvable.'], 404);
        }

        $em->remove($projectMember);
        $em->flush();

        return $this->json(['message' => 'Membre retiré de l\'équipe.']);
    }
}
