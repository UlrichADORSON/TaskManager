<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class AttachmentController extends AbstractController
{
    #[Route('/attachment', name: 'app_attachment')]
    public function index(): Response
    {
        return $this->render('attachment/index.html.twig', [
            'controller_name' => 'AttachmentController',
        ]);
    }
}
