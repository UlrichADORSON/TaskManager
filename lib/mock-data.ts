import type {
  User, Project, Subtask, Channel, Message, AppNotification,
  ProgressPoint, Attachment, ModificationRequest,
} from '@/types';

// ============================================================
// MOCK DATA — static dataset for the frontend prototype
// ============================================================

// ---------- Users
export const mockUsers: User[] = [
  // Admin
  {
    id: 'u-admin-1',
    name: 'Sophie Laurent',
    email: 'sophie.laurent@proflow.io',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=b6e3f4',
    phone: '+33 6 12 34 56 78',
    address: '12 Rue de la Paix, 75002 Paris',
    bio: 'Directrice générale de ProFlow. Passionnée par la gestion de projet et l\'innovation digitale.',
    createdAt: '2024-01-15T08:00:00Z',
  },
  // Managers
  {
    id: 'u-mgr-1',
    name: 'Karim Benali',
    email: 'karim.benali@proflow.io',
    role: 'manager',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim&backgroundColor=c0aede',
    jobTitle: 'Chef de projet senior',
    availability: 'busy',
    workload: 75,
    phone: '+33 6 23 45 67 89',
    address: '45 Avenue Victor Hugo, 69006 Lyon',
    bio: 'Chef de projet senior avec 8 ans d\'expérience en gestion de projets web et mobile.',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'u-mgr-2',
    name: 'Élodie Martin',
    email: 'elodie.martin@proflow.io',
    role: 'manager',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elodie&backgroundColor=d1f4e0',
    jobTitle: 'Chef de projet',
    availability: 'available',
    workload: 40,
    phone: '+33 6 34 56 78 90',
    address: '8 Rue des Lilas, 33000 Bordeaux',
    bio: 'Chef de projet spécialisée en refonte UI/UX et design system.',
    createdAt: '2024-02-10T08:00:00Z',
  },
  // Employees
  {
    id: 'u-emp-1',
    name: 'Thomas Dubois',
    email: 'thomas.dubois@proflow.io',
    role: 'employee',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas&backgroundColor=ffd5dc',
    jobTitle: 'Développeur Frontend',
    availability: 'busy',
    workload: 80,
    phone: '+33 6 45 67 89 01',
    address: '23 Rue du Commerce, 75015 Paris',
    bio: 'Développeur React/Next.js avec une passion pour les interfaces performantes et accessibles.',
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'u-emp-2',
    name: 'Lina Chen',
    email: 'lina.chen@proflow.io',
    role: 'employee',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina&backgroundColor=c4f0d0',
    jobTitle: 'Designer UI/UX',
    availability: 'available',
    workload: 30,
    phone: '+33 6 56 78 90 12',
    address: '15 Rue du Faubourg, 31000 Toulouse',
    bio: 'Designer UI/UX créative, spécialisée dans la création de design systems et maquettes haute fidélité.',
    createdAt: '2024-03-05T08:00:00Z',
  },
  {
    id: 'u-emp-3',
    name: 'Marco Rossi',
    email: 'marco.rossi@proflow.io',
    role: 'employee',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco&backgroundColor=ffdfbf',
    jobTitle: 'Développeur Backend',
    availability: 'busy',
    workload: 90,
    phone: '+33 6 67 89 01 23',
    address: '7 Boulevard Gambetta, 13001 Marseille',
    bio: 'Développeur backend expert Laravel/PHP et architecte de bases de données MySQL.',
    createdAt: '2024-03-10T08:00:00Z',
  },
  {
    id: 'u-emp-4',
    name: 'Aïcha Diallo',
    email: 'aicha.diallo@proflow.io',
    role: 'employee',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aicha&backgroundColor=b6e3f4',
    jobTitle: 'Chef de projet junior',
    availability: 'available',
    workload: 20,
    phone: '+33 6 78 90 12 34',
    address: '31 Rue de Strasbourg, 44000 Nantes',
    bio: 'Chef de projet junior motivée, spécialisée dans l\'analyse des besoins et la coordination d\'équipe.',
    createdAt: '2024-03-15T08:00:00Z',
  },
  {
    id: 'u-emp-5',
    name: 'Jakub Nowak',
    email: 'jakub.nowak@proflow.io',
    role: 'employee',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jakub&backgroundColor=c0aede',
    jobTitle: 'Développeur Frontend',
    availability: 'available',
    workload: 50,
    phone: '+33 6 89 01 23 45',
    address: '42 Rue de la République, 67000 Strasbourg',
    bio: 'Développeur frontend passionné par les animations et les interfaces utilisateur fluides.',
    createdAt: '2024-03-20T08:00:00Z',
  },
  // Clients
  {
    id: 'u-cli-1',
    name: 'Camille Rousseau',
    email: 'camille@techstart.fr',
    role: 'client',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camille&backgroundColor=ffd5dc',
    phone: '+33 7 11 22 33 44',
    company: 'TechStart SAS',
    address: '56 Avenue des Champs-Élysées, 75008 Paris',
    bio: 'Fondatrice de TechStart, startup spécialisée dans la vente en ligne de technologies innovantes.',
    createdAt: '2024-04-01T08:00:00Z',
  },
  {
    id: 'u-cli-2',
    name: 'Olivier Lefèvre',
    email: 'olivier@ecoshop.com',
    role: 'client',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivier&backgroundColor=d1f4e0',
    phone: '+33 7 22 33 44 55',
    company: 'EcoShop SARL',
    address: '18 Rue du Marché, 69002 Lyon',
    bio: 'Directeur d\'EcoShop, magasin en ligne de produits écologiques et durables.',
    createdAt: '2024-04-05T08:00:00Z',
  },
  {
    id: 'u-cli-3',
    name: 'Nadia Benali',
    email: 'nadia@urbanvibes.io',
    role: 'client',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia&backgroundColor=b6e3f4',
    phone: '+33 7 33 44 55 66',
    company: 'UrbanVibes',
    address: '29 Rue de la République, 13001 Marseille',
    bio: 'Gérante d\'UrbanVibes, marque de sport et bien-être urbain.',
    createdAt: '2024-04-10T08:00:00Z',
  },
];

// ---------- Helpers
function makeAttachment(id: string, name: string, type: string, by: string): Attachment {
  return { id, fileName: name, fileType: type, url: `https://example.com/files/${id}`, uploadedBy: by, uploadedAt: '2024-06-15T10:00:00Z' };
}

function makeProgressTimeline(start: string, end: string, actualNow: number): ProgressPoint[] {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const today = Date.now();
  const points: ProgressPoint[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = s + ((e - s) * i) / steps;
    const date = new Date(t).toISOString();
    const planned = Math.round((100 * i) / steps);
    let actual = 0;
    if (t <= today) {
      const ratio = Math.min(1, (t - s) / (today - s));
      actual = Math.round(actualNow * ratio);
    }
    points.push({ date, planned, actual });
  }
  // Ensure the last actual point reflects current progress
  if (today <= e) {
    const lastActual = points.filter((p) => new Date(p.date).getTime() <= today);
    if (lastActual.length > 0) {
      lastActual[lastActual.length - 1].actual = actualNow;
    }
  }
  return points;
}

// ---------- Subtasks
const subtask1: Subtask[] = [
  {
    id: 'st-1-1', projectId: 'p-1', title: 'Analyse des besoins',
    description: 'Recueillir et documenter les besoins fonctionnels du client.',
    status: 'done', priority: 'high', assignedToId: 'u-emp-4', dependsOnId: null,
    startDate: '2024-06-01T00:00:00Z', dueDate: '2024-06-07T00:00:00Z',
    progress: 100, attachments: [], createdAt: '2024-05-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-1-2', projectId: 'p-1', title: 'Wireframes & maquettes',
    description: 'Créer les wireframes et maquettes haute fidélité de l\'interface.',
    status: 'done', priority: 'high', assignedToId: 'u-emp-2', dependsOnId: 'st-1-1',
    startDate: '2024-06-08T00:00:00Z', dueDate: '2024-06-20T00:00:00Z',
    progress: 100, attachments: [makeAttachment('att-1', 'maquettes_v2.fig', 'application/octet-stream', 'u-emp-2')], createdAt: '2024-05-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-1-3', projectId: 'p-1', title: 'Développement Frontend',
    description: 'Intégrer les maquettes en React/Next.js avec TailwindCSS.',
    status: 'in_progress', priority: 'urgent', assignedToId: 'u-emp-1', dependsOnId: 'st-1-2',
    startDate: '2024-06-21T00:00:00Z', dueDate: '2024-07-15T00:00:00Z',
    progress: 60, attachments: [], createdAt: '2024-05-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-1-4', projectId: 'p-1', title: 'Développement Backend & API',
    description: 'Créer l\'API REST (Laravel) et la base de données MySQL.',
    status: 'in_progress', priority: 'high', assignedToId: 'u-emp-3', dependsOnId: 'st-1-1',
    startDate: '2024-06-10T00:00:00Z', dueDate: '2024-07-10T00:00:00Z',
    progress: 70, attachments: [], createdAt: '2024-05-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-1-5', projectId: 'p-1', title: 'Tests & QA',
    description: 'Rédiger et exécuter les scénarios de test, corriger les bugs.',
    status: 'todo', priority: 'medium', assignedToId: 'u-emp-5', dependsOnId: 'st-1-3',
    startDate: '2024-07-16T00:00:00Z', dueDate: '2024-07-25T00:00:00Z',
    progress: 0, attachments: [], createdAt: '2024-05-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-1-6', projectId: 'p-1', title: 'Déploiement & livraison',
    description: 'Déployer sur Netlify et remettre le projet au client.',
    status: 'todo', priority: 'high', assignedToId: null, dependsOnId: 'st-1-5',
    startDate: '2024-07-26T00:00:00Z', dueDate: '2024-07-31T00:00:00Z',
    progress: 0, attachments: [], createdAt: '2024-05-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
];

const subtask2: Subtask[] = [
  {
    id: 'st-2-1', projectId: 'p-2', title: 'Audit UX existant',
    description: 'Analyser le site actuel et identifier les points de friction.',
    status: 'done', priority: 'medium', assignedToId: 'u-emp-2', dependsOnId: null,
    startDate: '2024-07-01T00:00:00Z', dueDate: '2024-07-05T00:00:00Z',
    progress: 100, attachments: [], createdAt: '2024-06-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-2-2', projectId: 'p-2', title: 'Refonte visuelle',
    description: 'Nouvelle charte graphique et design system.',
    status: 'review', priority: 'high', assignedToId: 'u-emp-2', dependsOnId: 'st-2-1',
    startDate: '2024-07-06T00:00:00Z', dueDate: '2024-07-18T00:00:00Z',
    progress: 85, attachments: [makeAttachment('att-2', 'design_system.fig', 'application/octet-stream', 'u-emp-2')], createdAt: '2024-06-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-2-3', projectId: 'p-2', title: 'Intégration nouvelle UI',
    description: 'Remplacer les anciens composants par les nouveaux.',
    status: 'todo', priority: 'high', assignedToId: 'u-emp-1', dependsOnId: 'st-2-2',
    startDate: '2024-07-19T00:00:00Z', dueDate: '2024-08-05T00:00:00Z',
    progress: 0, attachments: [], createdAt: '2024-06-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
];

const subtask3: Subtask[] = [
  {
    id: 'st-3-1', projectId: 'p-3', title: 'Architecture technique',
    description: 'Définir l\'architecture, le choix des technos et le schéma de base de données.',
    status: 'todo', priority: 'high', assignedToId: 'u-emp-3', dependsOnId: null,
    startDate: '2024-09-01T00:00:00Z', dueDate: '2024-09-07T00:00:00Z',
    progress: 0, attachments: [], createdAt: '2024-08-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
  {
    id: 'st-3-2', projectId: 'p-3', title: 'Design & prototypage',
    description: 'Maquettes et prototype interactif.',
    status: 'todo', priority: 'medium', assignedToId: 'u-emp-2', dependsOnId: null,
    startDate: '2024-09-01T00:00:00Z', dueDate: '2024-09-10T00:00:00Z',
    progress: 0, attachments: [], createdAt: '2024-08-28T08:00:00Z',
    isActive: false, activeSessions: [],
  },
];

// ---------- Channels & Messages
function makeChannel(
  id: string, projectId: string, type: 'client_admin' | 'project_group',
  name: string, participants: { userId: string; role: string }[],
  messages: Message[],
): Channel {
  return { id, projectId, type, name, participants: participants as Channel['participants'], messages };
}

const channelsP1: Channel[] = [
  makeChannel('ch-1-ca', 'p-1', 'client_admin', 'Client ↔ Admin — Plateforme E-commerce',
    [{ userId: 'u-cli-1', role: 'client' }, { userId: 'u-admin-1', role: 'admin' }],
    [
      { id: 'm-1', channelId: 'ch-1-ca', authorId: 'u-cli-1', content: 'Bonjour, voici le cahier des charges détaillé pour la plateforme.', attachments: [makeAttachment('att-cdc', 'cahier_des_charges.pdf', 'application/pdf', 'u-cli-1')], createdAt: '2024-05-20T09:00:00Z' },
      { id: 'm-2', channelId: 'ch-1-ca', authorId: 'u-admin-1', content: 'Merci Camille, nous étudions votre demande et revenons vers vous rapidement.', attachments: [], createdAt: '2024-05-20T11:30:00Z' },
      { id: 'm-3', channelId: 'ch-1-ca', authorId: 'u-admin-1', content: 'Votre projet a été validé ! Karim Benali sera votre manager de projet.', attachments: [], createdAt: '2024-05-22T14:00:00Z' },
      { id: 'm-4', channelId: 'ch-1-ca', authorId: 'u-cli-1', content: 'Parfait, merci beaucoup ! J\'attends avec impatience les premières maquettes.', attachments: [], createdAt: '2024-05-22T15:15:00Z' },
    ],
  ),
  makeChannel('ch-1-pg', 'p-1', 'project_group', 'Groupe Projet — Plateforme E-commerce',
    [{ userId: 'u-cli-1', role: 'client' }, { userId: 'u-mgr-1', role: 'manager' }, { userId: 'u-emp-1', role: 'employee' }, { userId: 'u-emp-2', role: 'employee' }, { userId: 'u-emp-3', role: 'employee' }, { userId: 'u-emp-4', role: 'employee' }, { userId: 'u-emp-5', role: 'employee' }],
    [
      { id: 'm-5', channelId: 'ch-1-pg', authorId: 'u-mgr-1', content: 'Bonjour à tous ! Bienvenue sur le canal du projet. La phase de démarrage commence aujourd\'hui.', attachments: [], createdAt: '2024-06-01T08:00:00Z' },
      { id: 'm-6', channelId: 'ch-1-pg', authorId: 'u-emp-2', content: 'Je commence les wireframes. Camille, as-tu une préférence de style ?', attachments: [], createdAt: '2024-06-01T10:00:00Z' },
      { id: 'm-7', channelId: 'ch-1-pg', authorId: 'u-cli-1', content: 'Quelque chose de moderne et épuré, dans les tons bleu/vert.', attachments: [makeAttachment('att-logo', 'logo_ecoshop.png', 'image/png', 'u-cli-1')], createdAt: '2024-06-01T10:30:00Z' },
      { id: 'm-8', channelId: 'ch-1-pg', authorId: 'u-emp-1', content: 'Le frontend avance bien, j\'ai monté la structure des pages principales.', attachments: [], createdAt: '2024-06-25T16:00:00Z' },
      { id: 'm-9', channelId: 'ch-1-pg', authorId: 'u-emp-3', content: 'L\'API est à 70%, l\'authentification et la gestion produits sont prêtes.', attachments: [], createdAt: '2024-06-28T11:00:00Z' },
    ],
  ),
];

const channelsP2: Channel[] = [
  makeChannel('ch-2-ca', 'p-2', 'client_admin', 'Client ↔ Admin — Refonte Site Vit',
    [{ userId: 'u-cli-2', role: 'client' }, { userId: 'u-admin-1', role: 'admin' }],
    [
      { id: 'm-10', channelId: 'ch-2-ca', authorId: 'u-cli-2', content: 'Bonjour, je souhaite refondre mon site existant pour le rendre plus moderne.', attachments: [], createdAt: '2024-06-25T09:00:00Z' },
      { id: 'm-11', channelId: 'ch-2-ca', authorId: 'u-admin-1', content: 'Bonjour Olivier, c\'est noté. Élodie s\'occupera de votre projet.', attachments: [], createdAt: '2024-06-25T14:00:00Z' },
    ],
  ),
  makeChannel('ch-2-pg', 'p-2', 'project_group', 'Groupe Projet — Refonte Site Vit',
    [{ userId: 'u-cli-2', role: 'client' }, { userId: 'u-mgr-2', role: 'manager' }, { userId: 'u-emp-2', role: 'employee' }, { userId: 'u-emp-1', role: 'employee' }],
    [
      { id: 'm-12', channelId: 'ch-2-pg', authorId: 'u-mgr-2', content: 'Bonjour ! On démarre par un audit de l\'existant. Lina, tu t\'en charges ?', attachments: [], createdAt: '2024-07-01T08:00:00Z' },
      { id: 'm-13', channelId: 'ch-2-pg', authorId: 'u-emp-2', content: 'Oui, je commence aujourd\'hui. Les premiers retours d\'ici 2 jours.', attachments: [], createdAt: '2024-07-01T09:00:00Z' },
      { id: 'm-14', channelId: 'ch-2-pg', authorId: 'u-emp-2', content: 'La refonte visuelle est en review, j\'ai partagé le fichier Figma.', attachments: [makeAttachment('att-ds', 'refonte_design.fig', 'application/octet-stream', 'u-emp-2')], createdAt: '2024-07-16T15:00:00Z' },
    ],
  ),
];

const channelsP3: Channel[] = [
  makeChannel('ch-3-ca', 'p-3', 'client_admin', 'Client ↔ Admin — App Mobile Fitness',
    [{ userId: 'u-cli-3', role: 'client' }, { userId: 'u-admin-1', role: 'admin' }],
    [
      { id: 'm-15', channelId: 'ch-3-ca', authorId: 'u-cli-3', content: 'Bonjour, j\'aimerais développer une application mobile de coaching fitness.', attachments: [makeAttachment('att-brief', 'brief_app_fitness.pdf', 'application/pdf', 'u-cli-3')], createdAt: '2024-08-20T09:00:00Z' },
    ],
  ),
];

// ---------- Projects
export const mockProjects: Project[] = [
  {
    id: 'p-1',
    title: 'Plateforme E-commerce TechStart',
    description: 'Création d\'une plateforme e-commerce complète avec gestion de catalogue, panier, paiement Stripe et espace client. La plateforme doit être responsive et optimisée SEO.',
    clientId: 'u-cli-1',
    status: 'in_progress',
    priority: 'high',
    managerId: 'u-mgr-1',
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-07-31T00:00:00Z',
    budget: 45000,
    progress: 55,
    category: 'E-commerce',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=techstart&backgroundColor=221,83,53',
    members: [
      { userId: 'u-cli-1', role: 'client', joinedAt: '2024-05-20T00:00:00Z' },
      { userId: 'u-mgr-1', role: 'manager', joinedAt: '2024-05-22T00:00:00Z' },
      { userId: 'u-emp-1', role: 'employee', joinedAt: '2024-06-01T00:00:00Z' },
      { userId: 'u-emp-2', role: 'employee', joinedAt: '2024-06-01T00:00:00Z' },
      { userId: 'u-emp-3', role: 'employee', joinedAt: '2024-06-01T00:00:00Z' },
      { userId: 'u-emp-4', role: 'employee', joinedAt: '2024-06-01T00:00:00Z' },
      { userId: 'u-emp-5', role: 'employee', joinedAt: '2024-06-15T00:00:00Z' },
    ],
    subtasks: subtask1,
    progressTimeline: makeProgressTimeline('2024-06-01T00:00:00Z', '2024-07-31T00:00:00Z', 55),
    channels: channelsP1,
    attachments: [makeAttachment('att-p1-1', 'cahier_des_charges.pdf', 'application/pdf', 'u-cli-1'), makeAttachment('att-p1-2', 'logo_techstart.png', 'image/png', 'u-cli-1')],
    modifications: [
      { id: 'mod-1', projectId: 'p-1', subtaskId: 'st-1-3', target: 'subtask', requestedById: 'u-emp-1', requestedByName: 'Thomas Dubois', field: 'dueDate', oldValue: '2024-07-15', newValue: '2024-07-22', reason: 'Le délai initial ne suffit pas suite aux retours du client sur les maquettes. Une semaine supplémentaire est nécessaire.', status: 'pending', reviewedById: null, reviewNote: '', createdAt: '2024-09-01T10:00:00Z', reviewedAt: null },
      { id: 'mod-2', projectId: 'p-1', subtaskId: 'st-1-4', target: 'subtask', requestedById: 'u-emp-3', requestedByName: 'Marco Rossi', field: 'description', oldValue: 'Créer l\'API REST (Laravel) et la base de données MySQL.', newValue: 'Créer l\'API REST (Laravel), la base de données MySQL et intégrer un système de cache Redis pour optimiser les performances.', reason: 'Les temps de réponse sur la gestion du catalogue dépassent les 2 secondes. Ajouter Redis améliorerait drastiquement les performances.', status: 'approved', reviewedById: 'u-admin-1', reviewNote: 'Demande justifiée, le cache Redis est une excellente idée pour les performances.', createdAt: '2024-08-28T14:00:00Z', reviewedAt: '2024-08-29T09:00:00Z' },
    ],
    createdAt: '2024-05-20T08:00:00Z',
  },
  {
    id: 'p-2',
    title: 'Refonte Site Vitrine EcoShop',
    description: 'Refonte complète du site vitrine d\'EcoShop avec nouveau design system, amélioration des performances et accessibilité. Migration vers Next.js.',
    clientId: 'u-cli-2',
    status: 'in_progress',
    priority: 'medium',
    managerId: 'u-mgr-2',
    startDate: '2024-07-01T00:00:00Z',
    endDate: '2024-08-15T00:00:00Z',
    budget: 22000,
    progress: 35,
    category: 'Site vitrine',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=ecoshop&backgroundColor=142,71,45',
    members: [
      { userId: 'u-cli-2', role: 'client', joinedAt: '2024-06-25T00:00:00Z' },
      { userId: 'u-mgr-2', role: 'manager', joinedAt: '2024-06-26T00:00:00Z' },
      { userId: 'u-emp-2', role: 'employee', joinedAt: '2024-07-01T00:00:00Z' },
      { userId: 'u-emp-1', role: 'employee', joinedAt: '2024-07-01T00:00:00Z' },
    ],
    subtasks: subtask2,
    progressTimeline: makeProgressTimeline('2024-07-01T00:00:00Z', '2024-08-15T00:00:00Z', 35),
    channels: channelsP2,
    attachments: [makeAttachment('att-p2-1', 'brief_refonte.pdf', 'application/pdf', 'u-cli-2')],
    modifications: [
      { id: 'mod-3', projectId: 'p-2', subtaskId: 'st-2-3', target: 'subtask', requestedById: 'u-emp-1', requestedByName: 'Thomas Dubois', field: 'title', oldValue: 'Intégration nouvelle UI', newValue: 'Intégration nouvelle UI + migration composants legacy', reason: 'L\'ancien site contient plus de composants legacy que prévu. Le titre devrait refléter le périmètre réel.', status: 'rejected', reviewedById: 'u-admin-1', reviewNote: 'Le changement de titre n\'est pas nécessaire. La description suffit à clarifier le périmètre.', createdAt: '2024-08-15T11:00:00Z', reviewedAt: '2024-08-16T08:00:00Z' },
    ],
    createdAt: '2024-06-25T08:00:00Z',
  },
  {
    id: 'p-3',
    title: 'Application Mobile UrbanVibes Fitness',
    description: 'Application mobile de coaching fitness personnalisé avec suivi des entraînements, plans nutritionnels et communauté. iOS + Android (React Native).',
    clientId: 'u-cli-3',
    status: 'pending',
    priority: 'urgent',
    managerId: null,
    startDate: '2024-09-01T00:00:00Z',
    endDate: '2024-12-15T00:00:00Z',
    budget: 75000,
    progress: 0,
    category: 'Application mobile',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=urbanvibes&backgroundColor=172,76,40',
    members: [
      { userId: 'u-cli-3', role: 'client', joinedAt: '2024-08-20T00:00:00Z' },
    ],
    subtasks: [],
    progressTimeline: [],
    channels: channelsP3,
    attachments: [makeAttachment('att-p3-1', 'brief_app_fitness.pdf', 'application/pdf', 'u-cli-3')],
    modifications: [],
    createdAt: '2024-08-20T08:00:00Z',
  },
  {
    id: 'p-4',
    title: 'Dashboard Analytics B2B',
    description: 'Tableau de bord analytics B2B avec visualisation de données en temps réel, exports PDF/Excel et gestion multi-tenant.',
    clientId: 'u-cli-1',
    status: 'validated',
    priority: 'high',
    managerId: null,
    startDate: '2024-09-10T00:00:00Z',
    endDate: '2024-11-30T00:00:00Z',
    budget: 38000,
    progress: 0,
    category: 'Dashboard',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=dashb2b&backgroundColor=38,92,50',
    members: [
      { userId: 'u-cli-1', role: 'client', joinedAt: '2024-08-25T00:00:00Z' },
    ],
    subtasks: [],
    progressTimeline: [],
    channels: [],
    attachments: [makeAttachment('att-p4-1', 'spec_analytics.pdf', 'application/pdf', 'u-cli-1')],
    modifications: [],
    createdAt: '2024-08-25T08:00:00Z',
  },
  {
    id: 'p-5',
    title: 'Refonte Logo & Identité — UrbanVibes',
    description: 'Création d\'une nouvelle identité visuelle : logo, charte graphique, déclinaisons print et digital.',
    clientId: 'u-cli-3',
    status: 'rejected',
    priority: 'low',
    managerId: null,
    startDate: '2024-08-15T00:00:00Z',
    endDate: '2024-09-15T00:00:00Z',
    budget: 8000,
    progress: 0,
    rejectionReason: 'Le budget alloué est insuffisant par rapport au périmètre demandé. Nous vous invitons à revoir le budget ou réduire le périmètre (par ex. ne garder que le logo dans un premier temps).',
    category: 'Design',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=urbanvibes2&backgroundColor=0,84,60',
    members: [
      { userId: 'u-cli-3', role: 'client', joinedAt: '2024-08-10T00:00:00Z' },
    ],
    subtasks: [],
    progressTimeline: [],
    channels: [],
    attachments: [],
    modifications: [],
    createdAt: '2024-08-10T08:00:00Z',
  },
];

// ---------- Notifications
export const mockNotifications: AppNotification[] = [
  { id: 'n-1', userId: 'u-admin-1', type: 'project_submitted', title: 'Nouveau projet soumis', message: '« Application Mobile UrbanVibes Fitness » attend validation.', projectId: 'p-3', read: false, createdAt: '2024-08-20T09:00:00Z' },
  { id: 'n-2', userId: 'u-admin-1', type: 'project_submitted', title: 'Nouveau projet soumis', message: '« Dashboard Analytics B2B » attend validation.', projectId: 'p-4', read: false, createdAt: '2024-08-25T10:00:00Z' },
  { id: 'n-3', userId: 'u-admin-1', type: 'delay_detected', title: 'Retard détecté', message: 'Le projet « Plateforme E-commerce TechStart » accuse un retard sur le développement frontend.', projectId: 'p-1', read: true, createdAt: '2024-08-28T08:00:00Z' },
  { id: 'n-4', userId: 'u-cli-1', type: 'project_validated', title: 'Projet validé !', message: 'Votre projet « Plateforme E-commerce TechStart » a été validé et un manager vous a été assigné.', projectId: 'p-1', read: false, createdAt: '2024-05-22T14:00:00Z' },
  { id: 'n-5', userId: 'u-cli-1', type: 'new_message', title: 'Nouveau message', message: 'Karim Benali a envoyé un message dans le canal groupe du projet.', projectId: 'p-1', read: false, createdAt: '2024-06-01T08:00:00Z' },
  { id: 'n-6', userId: 'u-mgr-1', type: 'subtask_assigned', title: 'Projet assigné', message: 'Le projet « Plateforme E-commerce TechStart » vous a été assigné.', projectId: 'p-1', read: true, createdAt: '2024-05-22T15:00:00Z' },
  { id: 'n-7', userId: 'u-emp-1', type: 'subtask_assigned', title: 'Nouvelle sous-tâche', message: 'Vous avez été assigné à « Développement Frontend ».', projectId: 'p-1', read: false, createdAt: '2024-06-01T09:00:00Z' },
  { id: 'n-8', userId: 'u-emp-3', type: 'subtask_assigned', title: 'Nouvelle sous-tâche', message: 'Vous avez été assigné à « Développement Backend & API ».', projectId: 'p-1', read: false, createdAt: '2024-06-01T09:00:00Z' },
  { id: 'n-9', userId: 'u-cli-3', type: 'project_rejected', title: 'Projet rejeté', message: 'Votre projet « Refonte Logo & Identité — UrbanVibes » a été rejeté. Consultez le motif.', projectId: 'p-5', read: false, createdAt: '2024-08-12T10:00:00Z' },
  { id: 'n-10', userId: 'u-mgr-2', type: 'subtask_assigned', title: 'Projet assigné', message: 'Le projet « Refonte Site Vitrine EcoShop » vous a été assigné.', projectId: 'p-2', read: true, createdAt: '2024-06-26T10:00:00Z' },
];
