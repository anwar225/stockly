import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Récupère le store actif pour l'utilisateur connecté.
 *
 * Comportement :
 * - Utilisateur non authentifié : erreur UNAUTHENTICATED
 * - Utilisateur désactivé : erreur USER_DISABLED
 * - Aucun magasin associé (pas de StoreMember) : erreur NO_STORE_ACCESS
 * - Un seul magasin associé : sélection automatique
 * - Plusieurs magasins, sans sélection : erreur STORE_SELECTION_REQUIRED
 * - Magasin sélectionné : vérification StoreMember
 *
 * Note de sécurité : Le fallback sur organizationId a été retiré.
 * L'accès aux magasins nécessite désormais un StoreMember explicite.
 * Les utilisateurs existants sans StoreMember doivent migrer via Lot 3.
 *
 * @param storeIdOptionnel - StoreId explicite (pour sélection utilisateur)
 * @throws {Error} 'UNAUTHENTICATED' si aucune session valide
 * @throws {Error} 'USER_DISABLED' si l'utilisateur est désactivé
 * @throws {Error} 'NO_STORE_ACCESS' si aucun StoreMember trouvé
 * @throws {Error} 'STORE_SELECTION_REQUIRED' si plusieurs stores sans sélection
 * @throws {Error} 'STORE_ACCESS_DENIED' si l'utilisateur n'a pas accès au store
 * @returns L'objet store complet
 */
export async function getCurrentStore(storeIdOptionnel?: string) {
  const session = await auth()

  if (!session?.user) {
    throw new Error("UNAUTHENTICATED")
  }

  // Vérifier que l'utilisateur est actif
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { active: true },
  })

  if (!user || !user.active) {
    throw new Error("USER_DISABLED")
  }

  // Priorité : storeId explicite > session activeStoreId > sélection automatique
  const targetStoreId = storeIdOptionnel || (session.user as any).activeStoreId

  if (targetStoreId) {
    // Cas : Store spécifique demandé
    const storeMember = await prisma.storeMember.findUnique({
      where: {
        userId_storeId: {
          userId: session.user.id,
          storeId: targetStoreId,
        },
      },
      include: {
        store: true,
      },
    })

    if (!storeMember) {
      throw new Error("STORE_ACCESS_DENIED")
    }

    return storeMember.store
  }

  // Cas : Aucun store spécifique, tenter sélection automatique via StoreMember
  const storeMembers = await prisma.storeMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      store: true,
    },
  })

  if (storeMembers.length === 0) {
    // Aucun StoreMember : l'utilisateur n'a pas accès à un magasin
    // Le fallback sur organizationId est retiré pour sécurité stricte
    // Les utilisateurs sans StoreMember doivent migrer vers StoreMember via Lot 3
    throw new Error("NO_STORE_ACCESS")
  }

  if (storeMembers.length === 1) {
    // Un seul store : sélection automatique
    return storeMembers[0].store
  }

  // Plusieurs stores : demande de sélection
  throw new Error("STORE_SELECTION_REQUIRED")
}
