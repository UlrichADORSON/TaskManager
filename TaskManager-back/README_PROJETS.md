# Backend Symfony — Module Projets

Ce dossier est le backend Symfony extrait de `TaskManager-lot1-lot2-clean.zip` pour être ajouté à `mapp.zip`.

## Périmètre

Uniquement le module **Projets** :
- `Project` : informations, titre, description, statut, priorité, budget, progression, dates, client/chef de projet.
- `ProjectMember` : utilisateurs associés, rôle, date de participation.
- `CalendarEvent` : événements, réunions, échéances et dates importantes.
- `ProjectStatusLog` : historique des changements de statut, ancienne/nouvelle valeur, acteur, date et motif.

Les autres modules métier du backend source (tâches, notifications, administration, etc.) ne sont pas copiés.

### Dépendance technique

`User` et `UserRepository` sont conservés uniquement comme dépendance nécessaire aux relations projet et à l'authentification Symfony/JWT. Aucun contrôleur métier utilisateur n'est inclus ici.

## Installation

Depuis `TaskManager/TaskManager-back` :

```bash
composer install
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:migrations:migrate --no-interaction
php -S 127.0.0.1:8000 -t public public/index.php
```

Le backend suppose que la table `user` existe déjà dans la base TaskManager, puisque les projets sont liés aux utilisateurs.

## API Projets

- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/{id}/members`
- `DELETE /api/projects/{projectId}/members/{userId}`
- `GET /api/projects/{id}/team-members`
- `POST /api/projects/{id}/team-members`
- `DELETE /api/projects/{id}/team-members/{memberId}`
- `GET /api/projects/{id}/events`
- `POST /api/projects/{id}/events`
- `PATCH /api/projects/{id}/events/{eventId}`
- `DELETE /api/projects/{id}/events/{eventId}`
- `POST /api/projects/{id}/validate`
- `POST /api/projects/{id}/reject`
- `POST /api/projects/{id}/assign`
- `GET /api/projects/{id}/workflow-history`

Toutes les routes `/api/...` du module nécessitent une authentification JWT.

## Adaptation au front mapp

Le front de `mapp.zip` est conservé sans modification. Le modèle `Project` côté backend accepte maintenant `startDate` et `endDate` et les retourne dans les réponses JSON. À la création, si ces dates ne sont pas fournies, la date de début est initialisée à maintenant et la date de fin à +30 jours.

Une migration dédiée `Version20260922100000.php` ajoute ces deux colonnes sans casser les projets existants.
