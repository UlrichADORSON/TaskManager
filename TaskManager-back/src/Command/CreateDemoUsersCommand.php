<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-demo-users',
    description: 'Create demo accounts for login page'
)]
class CreateDemoUsersCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $demoAccounts = [
            ['sophie.laurent@proflow.io', 'Sophie Laurent', 'admin123', ['ROLE_ADMIN'], 'Proflow'],
            ['karim.benali@proflow.io', 'Karim Benali', 'manager123', ['ROLE_CHEF_DE_PROJET'], 'Proflow'],
            ['thomas.dubois@proflow.io', 'Thomas Dubois', 'employe123', ['ROLE_MEMBRE'], 'Proflow'],
            ['camille@techstart.fr', 'Camille Tech', 'client123', ['ROLE_CLIENT'], 'TechStart'],
        ];

        foreach ($demoAccounts as [$email, $name, $password, $roles, $company]) {
            $existing = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
            if ($existing) {
                $output->writeln("  - $email already exists, updating...");
                $existing->setName($name);
                $existing->setRoles($roles);
                $existing->setPassword($this->hasher->hashPassword($existing, $password));
                $existing->setCompany($company);
                $this->em->persist($existing);
            } else {
                $user = new User();
                $user->setEmail($email);
                $user->setName($name);
                $user->setRoles($roles);
                $user->setPassword($this->hasher->hashPassword($user, $password));
                $user->setAvatarUrl('https://i.pravatar.cc/150?u=' . urlencode($email));
                $user->setCompany($company);
                $this->em->persist($user);
                $output->writeln("  + Created $email");
            }
        }

        $this->em->flush();
        $output->writeln('Demo users created successfully!');
        return Command::SUCCESS;
    }
}
