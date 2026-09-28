<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260923065415 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__subtask AS SELECT id FROM subtask');
        $this->addSql('DROP TABLE subtask');
        $this->addSql('CREATE TABLE subtask (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, status VARCHAR(20) NOT NULL, depends_on_id INTEGER DEFAULT NULL, CONSTRAINT FK_8BCBA9AE1E088F8 FOREIGN KEY (depends_on_id) REFERENCES subtask (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO subtask (id) SELECT id FROM __temp__subtask');
        $this->addSql('DROP TABLE __temp__subtask');
        $this->addSql('CREATE INDEX IDX_8BCBA9AE1E088F8 ON subtask (depends_on_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__subtask AS SELECT id FROM subtask');
        $this->addSql('DROP TABLE subtask');
        $this->addSql('CREATE TABLE subtask (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)');
        $this->addSql('INSERT INTO subtask (id) SELECT id FROM __temp__subtask');
        $this->addSql('DROP TABLE __temp__subtask');
    }
}
