<?php

namespace App\Controller;

use App\Entity\Subtask;
use App\Repository\SubtaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/subtasks')]
class SubtaskController extends AbstractController
{
    private const STATUSES = ['todo', 'in_progress', 'review', 'done', 'cancelled'];

    public function __construct(
        private EntityManagerInterface $em,
        private SubtaskRepository $repo
    ) {}

    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        return $this->json($this->repo->findAll(), 200, [], ['groups' => 'subtask:read']);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $subtask = $this->repo->find($id);
        if (!$subtask) {
            return $this->json(['error' => 'Not found'], 404);
        }

        return $this->json($subtask, 200, [], ['groups' => 'subtask:read']);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->decode($request);

        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '') {
            return $this->json(['error' => 'Title is required'], 422);
        }

        $status = $data['status'] ?? 'todo';
        if (!in_array($status, self::STATUSES, true)) {
            return $this->json(['error' => 'Invalid status'], 422);
        }

        $subtask = new Subtask();
        $subtask->setTitle($title);
        $subtask->setStatus($status);

        $error = $this->applyDependsOn($subtask, $data['dependsOnId'] ?? null);
        if ($error) {
            return $error;
        }

        if ('done' === $status && !$this->canBeDone($subtask)) {
            return $this->json(['error' => 'Dependency not completed yet'], 400);
        }

        $this->em->persist($subtask);
        $this->em->flush();

        return $this->json($subtask, 201, [], ['groups' => 'subtask:read']);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $subtask = $this->repo->find($id);
        if (!$subtask) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $data = $this->decode($request);

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                return $this->json(['error' => 'Title is required'], 422);
            }
            $subtask->setTitle($title);
        }

        if (array_key_exists('status', $data)) {
            if (!in_array($data['status'], self::STATUSES, true)) {
                return $this->json(['error' => 'Invalid status'], 422);
            }
            $subtask->setStatus($data['status']);
        }

        if (array_key_exists('dependsOnId', $data)) {
            $error = $this->applyDependsOn($subtask, $data['dependsOnId']);
            if ($error) {
                return $error;
            }
        }

        if ('done' === $subtask->getStatus() && !$this->canBeDone($subtask)) {
            return $this->json(['error' => 'Dependency not completed yet'], 400);
        }

        $this->em->flush();

        return $this->json($subtask, 200, [], ['groups' => 'subtask:read']);
    }

    #[Route('/{id}/status', methods: ['PATCH'])]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $subtask = $this->repo->find($id);
        if (!$subtask) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $data = $this->decode($request);
        $status = $data['status'] ?? null;

        if (!in_array($status, self::STATUSES, true)) {
            return $this->json(['error' => 'Invalid status'], 422);
        }

        if ('done' === $status && !$this->canBeDone($subtask)) {
            return $this->json(['error' => 'Dependency not completed yet'], 400);
        }

        $subtask->setStatus($status);
        $this->em->flush();

        return $this->json($subtask, 200, [], ['groups' => 'subtask:read']);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $subtask = $this->repo->find($id);
        if (!$subtask) {
            return $this->json(['error' => 'Not found'], 404);
        }

        foreach ($subtask->getDependents() as $dependent) {
            $dependent->setDependsOn(null);
        }

        $this->em->remove($subtask);
        $this->em->flush();

        return new JsonResponse(null, 204);
    }

    private function decode(Request $request): array
    {
        $data = json_decode($request->getContent(), true);

        return is_array($data) ? $data : [];
    }

    private function applyDependsOn(Subtask $subtask, mixed $dependsOnId): ?JsonResponse
    {
        if (null === $dependsOnId) {
            $subtask->setDependsOn(null);

            return null;
        }

        $dependsOn = $this->repo->find($dependsOnId);
        if (!$dependsOn || $dependsOn->getId() === $subtask->getId()) {
            return $this->json(['error' => 'Invalid dependency'], 422);
        }

        $cursor = $dependsOn;
        while (null !== $cursor) {
            if ($cursor->getId() === $subtask->getId()) {
                return $this->json(['error' => 'Circular dependency detected'], 422);
            }
            $cursor = $cursor->getDependsOn();
        }

        $subtask->setDependsOn($dependsOn);

        return null;
    }

    private function canBeDone(Subtask $subtask): bool
    {
        return null === $subtask->getDependsOn() || 'done' === $subtask->getDependsOn()->getStatus();
    }
}