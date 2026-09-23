<?php

namespace App\Entity;

use App\Repository\SubtaskRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SubtaskRepository::class)]
class Subtask
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups('subtask:read')]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups('subtask:read')]
    private ?string $title = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['todo', 'in_progress', 'review', 'done', 'cancelled'])]
    #[Groups('subtask:read')]
    private string $status = 'todo';

    #[ORM\ManyToOne(targetEntity: Subtask::class, inversedBy: 'dependents')]
    #[ORM\JoinColumn(nullable: true)]
    private ?self $dependsOn = null;

    #[ORM\OneToMany(mappedBy: 'dependsOn', targetEntity: Subtask::class)]
    private Collection $dependents;

    public function __construct()
    {
        $this->dependents = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getDependsOn(): ?self
    {
        return $this->dependsOn;
    }

    public function setDependsOn(?self $dependsOn): static
    {
        $this->dependsOn = $dependsOn;

        return $this;
    }

    #[Groups('subtask:read')]
    public function getDependsOnId(): ?int
    {
        return $this->dependsOn?->getId();
    }

    /**
     * @return Collection<int, self>
     */
    public function getDependents(): Collection
    {
        return $this->dependents;
    }
}