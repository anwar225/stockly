# Stockly

SaaS de gestion pour magasins d'électroménager.

## Développement

### Prérequis
- Node.js v24+
- pnpm
- PostgreSQL (Supabase)

### Installation
```bash
pnpm install
```

### Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet :
```env
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Base de données
```bash
# Générer le client Prisma
pnpm exec prisma generate

# Appliquer les migrations
pnpm exec prisma migrate deploy

# Seed (si nécessaire)
pnpm run db:seed
```

### Serveur de développement
```bash
pnpm dev
```

**Note pour Windows** : Le script `dev` utilise `NODE_OPTIONS=--dns-result-order=ipv4first` pour éviter une latence de connexion DNS IPv6 vers le pooler Supabase (8+ secondes par requête). Cette option est sans risque et n'affecte que le développement local.

### Build
```bash
pnpm build
```

### Production
```bash
pnpm start
```

## Architecture

- Next.js 16 (App Router)
- Prisma ORM 7 avec PostgreSQL (Supabase)
- NextAuth.js v4 pour l'authentification
- Tailwind CSS pour le styling
