<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class WorkSessionController extends AbstractController
{
    #[Route('/work/session', name: 'app_work_session')]
    public function index(): Response
    {
        return $this->render('work_session/index.html.twig', [
            'controller_name' => 'WorkSessionController',
        ]);
    }
}
