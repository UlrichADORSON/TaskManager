<?php

namespace App\Controller;

use App\Entity\CalendarEvent;
use App\Entity\User;
use App\Repository\CalendarEventRepository;
use App\Repository\ProjectRepository;
use App\Service\ProjectAccessService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Agenda projet : rendez-vous client et autres jalons (cadrage, design,
 * développement, recette, livraison, deadline...), type = 'rendez_vous' pour
 * un rendez-vous client.
 */
class CalendarEventController extends AbstractController
{
    private const ALLOWED_TYPES = [
        'cadrage', 'design', 'developpement', 'recette', 'livraison', 'rendez_vous', 'deadline',
    ];

    private function serialize(CalendarEvent $event): array
    {
        return [
            'id' => $event->getId(),
            'projectId' => $event->getProject()?->getId(),
            'title' => $event->getTitle(),
            'date' => $event->getDate()?->format(\DateTimeInterface::ATOM),
            'type' => $event->getType(),
            'description' => $event->getDescription(),
            'createdBy' => $event->getCreatedBy() ? [
                'id' => $event->getCreatedBy()->getId(),
                'name' => $event->getCreatedBy()->getName(),
            ] : null,
            'createdAt' => $event->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    #[Route('/api/projects/{id}/events', name: 'api_projects_events_list', methods: ['GET'])]
    public function list(
        int $id,
        ProjectRepository $projectRepository,
        CalendarEventRepository $eventRepository,
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

        $events = $eventRepository->findByProject($project);

        return $this->json(array_map(fn (CalendarEvent $e) => $this->serialize($e), $events));
    }

    #[Route('/api/projects/{id}/events', name: 'api_projects_events_create', methods: ['POST'])]
    public function create(
        int $id,
        Request $request,
        ProjectRepository $projectRepository,
        ProjectAccessService $access,
        EntityManagerInterface $em
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

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Données JSON invalides.'], 400);
        }

        $title = trim((string) ($data['title'] ?? ''));
        $type = (string) ($data['type'] ?? 'rendez_vous');
        $dateRaw = (string) ($data['date'] ?? '');

        if ($title === '') {
            return $this->json(['message' => 'Le titre est obligatoire.'], 400);
        }
        if (!in_array($type, self::ALLOWED_TYPES, true)) {
            return $this->json(['message' => 'Type d\'événement invalide.'], 400);
        }

        try {
            $date = new \DateTimeImmutable($dateRaw !== '' ? $dateRaw : 'now');
        } catch (\Exception) {
            return $this->json(['message' => 'Date invalide.'], 400);
        }

        $event = new CalendarEvent();
        $event->setProject($project);
        $event->setTitle($title);
        $event->setDate($date);
        $event->setType($type);
        $event->setDescription($data['description'] ?? null);
        $event->setCreatedBy($user);

        $em->persist($event);
        $em->flush();

        return $this->json($this->serialize($event), 201);
    }

    #[Route('/api/projects/{id}/events/{eventId}', name: 'api_projects_events_update', methods: ['PATCH'])]
    public function update(
        int $id,
        int $eventId,
        Request $request,
        ProjectRepository $projectRepository,
        CalendarEventRepository $eventRepository,
        ProjectAccessService $access,
        EntityManagerInterface $em
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

        $event = $eventRepository->find($eventId);
        if (!$event || $event->getProject()?->getId() !== $project->getId()) {
            return $this->json(['message' => 'Événement introuvable.'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Données JSON invalides.'], 400);
        }

        if (isset($data['title'])) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                return $this->json(['message' => 'Le titre est obligatoire.'], 400);
            }
            $event->setTitle($title);
        }
        if (isset($data['type'])) {
            if (!in_array($data['type'], self::ALLOWED_TYPES, true)) {
                return $this->json(['message' => 'Type d\'événement invalide.'], 400);
            }
            $event->setType($data['type']);
        }
        if (isset($data['date'])) {
            try {
                $event->setDate(new \DateTimeImmutable((string) $data['date']));
            } catch (\Exception) {
                return $this->json(['message' => 'Date invalide.'], 400);
            }
        }
        if (array_key_exists('description', $data)) {
            $event->setDescription($data['description']);
        }

        $em->flush();

        return $this->json($this->serialize($event));
    }

    #[Route('/api/projects/{id}/events/{eventId}', name: 'api_projects_events_delete', methods: ['DELETE'])]
    public function delete(
        int $id,
        int $eventId,
        ProjectRepository $projectRepository,
        CalendarEventRepository $eventRepository,
        ProjectAccessService $access,
        EntityManagerInterface $em
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

        $event = $eventRepository->find($eventId);
        if (!$event || $event->getProject()?->getId() !== $project->getId()) {
            return $this->json(['message' => 'Événement introuvable.'], 404);
        }

        $em->remove($event);
        $em->flush();

        return $this->json(['message' => 'Événement supprimé.']);
    }
}
