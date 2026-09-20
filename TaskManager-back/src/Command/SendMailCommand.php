<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[AsCommand(
    name: 'app:send-mail',
    description: 'Envoie un email de test'
)]
class SendMailCommand extends Command
{
    public function __construct(
        private MailerInterface $mailer
    ) {
        parent::__construct();
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output
    ): int {
        $email = (new Email())
            ->from('hello@demomailtrap.co')
            ->to('mjannickah@gmail.com')
            ->subject('Test email TaskManager')
            ->text(
                'Bonjour ! Ceci est un email de test envoyé depuis Symfony.'
            );

        try {
            $this->mailer->send($email);

            $output->writeln(
                '<info>Email envoyé avec succès !</info>'
            );

            return Command::SUCCESS;

        } catch (\Throwable $exception) {
            $output->writeln(
                '<error>Erreur : ' . $exception->getMessage() . '</error>'
            );

            return Command::FAILURE;
        }
    }
}