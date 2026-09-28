<?php

namespace App\Controller;

use App\Entity\SubtaskComment;
use App\Repository\SubtaskCommentRepository;
use App\Repository\SubtaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/subtasks/{subtaskId}/comments')]
class SubtaskCommentController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SubtaskRepository $subtaskRepo,
        private SubtaskCommentRepository $commentRepo,
        private SerializerInterface $serializer
    ) {}

    #[Route('', methods: ['GET'])]
    public function list(int $subtaskId): JsonResponse
    {
        $comments = $this->commentRepo->findBy(['subtask' => $subtaskId]);
        return new JsonResponse($this->serializer->serialize($comments, 'json', ['groups' => 'comment:read']), 200, [], true);
    }

    #[Route('', methods: ['POST'])]
    public function create(int $subtaskId, Request $request): JsonResponse
    {
        $subtask = $this->subtaskRepo->find($subtaskId);
        if (!$subtask) {
            return new JsonResponse(['error' => 'Subtask not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $comment = new SubtaskComment();
        $comment->setSubtask((string) $subtaskId);
        $content = $data['content'] ?? '';
        $comment->setContent(is_string($content) ? $content : '');

        $this->em->persist($comment);
        $this->em->flush();

        return new JsonResponse($this->serializer->serialize($comment, 'json', ['groups' => 'comment:read']), 201, [], true);
    }

    #[Route('/{commentId}', methods: ['DELETE'])]
    public function delete(int $subtaskId, int $commentId): JsonResponse
    {
        $comment = $this->commentRepo->find($commentId);
        if (!$comment) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        $this->em->remove($comment);
        $this->em->flush();

        return new JsonResponse(null, 204);
    }
}