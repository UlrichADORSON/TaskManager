<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\ProjectMember;
use App\Entity\ProjectStatusLog;
use App\Entity\User;
use App\Repository\ProjectRepository;
use App\Repository\ProjectStatusLogRepository;
use App\Repository\UserRepository;
use App\Service\ProjectAccessService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Workflow "Projets" du Lot 1 :
 *   soumission client (ProjectController::create, status = pending)
 *     -> validation ou rejet par l'admin
 *     -> assignation d'un chef de projet (manager)
 *
 * Nouveau contrôleur : ne modifie aucun fichier existant.
 */
class ProjectWorkflowController extends AbstractController
{
    private function serializeProject(Project $project): array
    {
        return [
            'id' => $project->getId(),
            'title' => $project->getTitle(),
            'status' => $project->getStatus(),
            'client' => $project->getClient() ? [
                'id' => $project->getClient()->getId(),
                'name' => $project->getClient()->getName(),
            ] : null,
            'manager' => $project->getManager() ? [
                'id' => $project->getManager()->getId(),
                'name' => $project->getManager()->getName(),
            ] : null,
        ];
    }

    private function serializeLog(ProjectStatusLog $log): array
    {
        return [
            'id' => $log->getId(),
            'fromStatus' => $log->getFromStatus(),
            'toStatus' => $log->getToStatus(),
            'reason' => $log->getReason(),
            'actor' => $log->getActor() ? [
                'id' => $log->getActor()->getId(),
                'name' => $log->getActor()->getName(),
            ] : null,
            'createdAt' => $log->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    #[Route('/api/projects/{id}/validate', name: 'api_projects_validate', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function validate(
        int $id,
        ProjectRepository $projectRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $admin */
        $admin = $this->getUser();

        $project = $projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        if ($project->getStatus() !== 'pending') {
            return $this->json(['message' => 'Seul un projet en attente peut être validé.'], 409);
        }

        $log = new ProjectStatusLog();
        $log->setProject($project);
        $log->setFromStatus($project->getStatus());
        $log->setToStatus('validated');
        $log->setActor($admin);

        $project->setStatus('validated');

        $em->persist($log);
        $em->flush();

        return $this->json([
            'message' => 'Projet validé.',
            'project' => $this->serializeProject($project),
        ]);
    }

    #[Route('/api/projects/{id}/reject', name: 'api_projects_reject', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function reject(
        int $id,
        Request $request,
        ProjectRepository $projectRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $admin */
        $admin = $this->getUser();

        $project = $projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        if ($project->getStatus() !== 'pending') {
            return $this->json(['message' => 'Seul un projet en attente peut être rejeté.'], 409);
        }

        $data = json_decode($request->getContent(), true);
        $reason = trim((string) ($data['reason'] ?? ''));
        if ($reason === '') {
            return $this->json(['message' => 'Le motif de rejet est obligatoire.'], 400);
        }

        $log = new ProjectStatusLog();
        $log->setProject($project);
        $log->setFromStatus($project->getStatus());
        $log->setToStatus('rejected');
        $log->setActor($admin);
        $log->setReason($reason);

        $project->setStatus('rejected');

        $em->persist($log);
        $em->flush();

        return $this->json([
            'message' => 'Projet rejeté.',
            'project' => $this->serializeProject($project),
        ]);
    }

    #[Route('/api/projects/{id}/assign', name: 'api_projects_assign', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function assign(
        int $id,
        Request $request,
        ProjectRepository $projectRepository,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $admin */
        $admin = $this->getUser();

        $project = $projectRepository->find($id);
        if (!$project) {
            return $this->json(['message' => 'Projet introuvable.'], 404);
        }

        if ($project->getStatus() !== 'validated') {
            return $this->json(['message' => 'Seul un projet validé peut être assigné à un chef de projet.'], 409);
        }

        $data = json_decode($request->getContent(), true);
        $managerId = (string) ($data['managerId'] ?? '');
        if ($managerId === '') {
            return $this->json(['message' => 'Le chef de projet est obligatoire.'], 400);
        }

        $manager = ctype_digit($managerId) ? $userRepository->find((int) $managerId) : $userRepository->findOneBy(['email' => $managerId]);
        if (!$manager) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }
        if (!in_array('ROLE_CHEF_DE_PROJET', $manager->getRoles(), true)) {
            return $this->json(['message' => 'Cet utilisateur n\'est pas un chef de projet.'], 400);
        }

        $log = new ProjectStatusLog();
        $log->setProject($project);
        $log->setFromStatus($project->getStatus());
        $log->setToStatus('assigned');
        $log->setActor($admin);
        $log->setReason(sprintf('Assigné à %s', $manager->getName()));

        $project->setManager($manager);
        $project->setStatus('assigned');

        // Ajoute (ou met à jour) le chef de projet dans l'équipe relationnelle du projet
        $existing = $em->getRepository(ProjectMember::class)->findOneBy([
            'project' => $project,
            'user' => $manager,
        ]);
        if (!$existing) {
            $projectMember = new ProjectMember();
            $projectMember->setProject($project);
            $projectMember->setUser($manager);
            $projectMember->setRole('chef_de_projet');
            $em->persist($projectMember);
        }

        $em->persist($log);
        $em->flush();

        return $this->json([
            'message' => 'Chef de projet assigné.',
            'project' => $this->serializeProject($project),
        ]);
    }

    #[Route('/api/projects/{id}/workflow-history', name: 'api_projects_workflow_history', methods: ['GET'])]
    public function history(
        int $id,
        ProjectRepository $projectRepository,
        ProjectStatusLogRepository $logRepository,
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

        $logs = $logRepository->findByProject($project);

        return $this->json(array_map(fn (ProjectStatusLog $l) => $this->serializeLog($l), $logs));
    }
}
