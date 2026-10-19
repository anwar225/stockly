import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/lib/generated/prisma/client"


/**
 * Vérifie que l'utilisateur est authentifié
 * @throws {Error} 'UNAUTHENTICATED' si aucune session valide
 * @returns La session NextAuth
 */
export async function requireAuth() {
  const session = await auth()

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED")
  }

  return session
}

/**
 * Vérifie que l'utilisateur est authentifié et actif (version légère sans DB)
 *
 * Cette fonction utilise la valeur active du JWT, qui est valide pendant la durée de vie du token.
 * Pour une vérification stricte avec DB, utilisez getCurrentStore() ou requireStoreAccess().
 *
 * @throws {Error} 'UNAUTHENTICATED' si aucune session valide
 * @throws {Error} 'USER_DISABLED' si l'utilisateur est désactivé
 * @returns La session NextAuth
 */
export async function requireActiveUser() {
  const session = await auth()

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED")
  }

  // Vérifier active depuis le JWT (léger, sans requête DB)
  if (session.user.active === false) {
    throw new Error("USER_DISABLED")
  }

  return session
}

/**
 * Vérifie que l'utilisateur a accès au store actif
 * @param storeIdOptionnel - StoreId explicite (optionnel)
 * @throws {Error} 'UNAUTHENTICATED' si aucune session valide
 * @throws {Error} 'USER_DISABLED' si l'utilisateur est désactivé
 * @throws {Error} 'NO_STORE_ACCESS' si aucun store trouvé
 * @throws {Error} 'STORE_SELECTION_REQUIRED' si plusieurs stores sans sélection
 * @throws {Error} 'STORE_ACCESS_DENIED' si l'utilisateur n'a pas accès au store
 * @returns La session et le store
 */
export async function requireStoreAccess(storeIdOptionnel?: string) {
  const session = await requireAuth()
  
  // Import dynamique pour éviter les dépendances circulaires
  const { getCurrentStore } = await import("./get-current-store")
  const store = await getCurrentStore(storeIdOptionnel)
  
  return { session, store }
}

/**
 * Vérifie que l'utilisateur a l'un des rôles requis pour le magasin courant
 *
 * Cette fonction vérifie le rôle spécifique au magasin via StoreMember.role,
 * ce qui permet des rôles différents par magasin pour le même utilisateur.
 *
 * Prérequis : La table StoreMember doit exister en base (migration Lot 1 appliquée).
 *
 * @param allowedRoles - Liste des rôles autorisés
 * @throws {Error} 'UNAUTHENTICATED' si aucune session valide
 * @throws {Error} 'USER_DISABLED' si l'utilisateur est désactivé
 * @throws {Error} 'NO_STORE_ACCESS' si aucun store trouvé
 * @throws {Error} 'STORE_SELECTION_REQUIRED' si plusieurs stores sans sélection
 * @throws {Error} 'STORE_ACCESS_DENIED' si l'utilisateur n'a pas accès au store
 * @throws {Error} 'INSUFFICIENT_PERMISSIONS' si le rôle n'est pas autorisé
 * @returns La session, le store et le rôle StoreMember
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const { session, store } = await requireStoreAccess()

  // Récupérer le StoreMember pour le store courant
  const storeMember = await prisma.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: session.user.id,
        storeId: store.id,
      },
    },
    select: {
      role: true,
    },
  })

  // Refuser par défaut si StoreMember n'existe pas
  if (!storeMember) {
    throw new Error("INSUFFICIENT_PERMISSIONS")
  }

  const storeRole = storeMember.role as UserRole

  if (!storeRole || !allowedRoles.includes(storeRole)) {
    throw new Error("INSUFFICIENT_PERMISSIONS")
  }

  return { session, store, role: storeRole }
}

/**
 * Vérifie que l'utilisateur a l'un des rôles requis pour le magasin courant (version sécurisée - StoreMember.role)
 *
 * Cette fonction vérifie le rôle spécifique au magasin via StoreMember.role,
 * ce qui permet des rôles différents par magasin pour le même utilisateur.
 *
 * Prérequis : La table StoreMember doit exister en base (migration Lot 1 appliquée).
 *
 * Note : Cette fonction est un alias de requireRole() pour la compatibilité.
 * La logique principale de vérification StoreMember.role est maintenant dans requireRole().
 *
 * @param allowedRoles - Liste des rôles autorisés
 * @throws {Error} 'UNAUTHENTICATED' si aucune session valide
 * @throws {Error} 'USER_DISABLED' si l'utilisateur est désactivé
 * @throws {Error} 'NO_STORE_ACCESS' si aucun store trouvé
 * @throws {Error} 'STORE_SELECTION_REQUIRED' si plusieurs stores sans sélection
 * @throws {Error} 'STORE_ACCESS_DENIED' si l'utilisateur n'a pas accès au store
 * @throws {Error} 'INSUFFICIENT_PERMISSIONS' si le rôle n'est pas autorisé
 * @returns La session, le store et le rôle StoreMember
 */
export async function requireStoreRole(allowedRoles: UserRole[]) {
  // Alias de requireRole() pour compatibilité
  return await requireRole(allowedRoles)
}

/**
 * Vérifie que l'utilisateur est OWNER ou ADMIN pour le magasin courant
 *
 * @throws {Error} 'INSUFFICIENT_PERMISSIONS' si le rôle n'est pas OWNER ou ADMIN
 * @returns La session, le store et le rôle StoreMember
 */
export async function requireAdmin() {
  return await requireRole(['OWNER', 'ADMIN'])
}

/**
 * Vérifie que l'utilisateur est OWNER pour le magasin courant
 *
 * @throws {Error} 'INSUFFICIENT_PERMISSIONS' si le rôle n'est pas OWNER
 * @returns La session, le store et le rôle StoreMember
 */
export async function requireOwner() {
  return await requireRole(['OWNER'])
}

/**
 * Vérifie que l'utilisateur est OWNER ou ADMIN pour le magasin courant (version sécurisée - StoreMember.role)
 *
 * Note : Cette fonction est un alias de requireAdmin() pour la compatibilité.
 * La logique principale de vérification StoreMember.role est maintenant dans requireRole().
 *
 * @throws {Error} 'INSUFFICIENT_PERMISSIONS' si le rôle n'est pas OWNER ou ADMIN
 * @returns La session, le store et le rôle StoreMember
 */
export async function requireStoreAdmin() {
  // Alias de requireAdmin() pour compatibilité
  return await requireAdmin()
}

/**
 * Vérifie que l'utilisateur est OWNER pour le magasin courant (version sécurisée - StoreMember.role)
 *
 * Note : Cette fonction est un alias de requireOwner() pour la compatibilité.
 * La logique principale de vérification StoreMember.role est maintenant dans requireRole().
 *
 * @throws {Error} 'INSUFFICIENT_PERMISSIONS' si le rôle n'est pas OWNER
 * @returns La session, le store et le rôle StoreMember
 */
export async function requireStoreOwner() {
  // Alias de requireOwner() pour compatibilité
  return await requireOwner()
}

/**
 * Gestionnaire d'erreur d'authentification pour les routes API
 * @param error - L'erreur à traiter
 * @returns Une réponse NextResponse appropriée
 */
export function handleAuthError(error: Error) {
  if (error.message === "UNAUTHENTICATED") {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if (error.message === "USER_DISABLED") {
    return NextResponse.json({ error: 'Compte désactivé' }, { status: 403 })
  }
  if (error.message === "STORE_SELECTION_REQUIRED") {
    return NextResponse.json({ error: 'Sélection de magasin requise' }, { status: 400 })
  }
  if (error.message === "STORE_ACCESS_DENIED") {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  if (error.message === "NO_STORE_ACCESS") {
    return NextResponse.json({ error: 'Aucun magasin accessible' }, { status: 403 })
  }
  if (error.message === "INSUFFICIENT_PERMISSIONS") {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }
  
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
}
