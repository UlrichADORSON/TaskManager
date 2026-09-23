<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260923035817 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE subtask_comment ADD COLUMN content VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE subtask_comment ADD COLUMN created_at DATETIME NOT NULL');
        $this->addSql('ALTER TABLE subtask_comment ADD COLUMN subtask VARCHAR(255) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__subtask_comment AS SELECT id FROM subtask_comment');
        $this->addSql('DROP TABLE subtask_comment');
        $this->addSql('CREATE TABLE subtask_comment (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)');
        $this->addSql('INSERT INTO subtask_comment (id) SELECT id FROM __temp__subtask_comment');
        $this->addSql('DROP TABLE __temp__subtask_comment');
    }
}
