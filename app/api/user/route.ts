import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentStore } from '@/lib/get-current-store'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user with store membership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        storeMembers: {
          include: {
            store: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Use getCurrentStore to determine the appropriate store
    let store: { id: string; name: string } | null = null
    let storeMember: { role: string; storeId: string } | undefined = undefined
    let roleLabel: string | null = null

    try {
      store = await getCurrentStore()
      
      if (store) {
        // Find the corresponding storeMember for the selected store
        storeMember = user.storeMembers.find(sm => sm.storeId === store!.id)

        if (storeMember) {
          // Translate role to French
          const roleTranslations: Record<string, string> = {
            OWNER: 'Propriétaire',
            ADMIN: 'Administrateur',
            MANAGER: 'Gestionnaire',
            EMPLOYEE: 'Employé',
          }
          roleLabel = roleTranslations[storeMember.role] || storeMember.role
        }
      }
    } catch (error) {
      // Handle getCurrentStore errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage === 'UNAUTHENTICATED') {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      }
      
      if (errorMessage === 'USER_DISABLED') {
        return NextResponse.json({ error: 'Compte désactivé' }, { status: 403 })
      }
      
      if (errorMessage === 'NO_STORE_ACCESS') {
        // User has no store access - return user info without store
        return NextResponse.json(
          {
            user: {
              name: user.name,
              email: user.email,
            },
            store: null,
            role: null,
          },
          { status: 200 }
        )
      }
      
      if (errorMessage === 'STORE_SELECTION_REQUIRED') {
        // User has multiple stores - return all stores for selection
        const storeOptions = user.storeMembers.map(sm => ({
          storeId: sm.storeId,
          storeName: sm.store.name,
          role: sm.role,
        }))
        
        return NextResponse.json(
          {
            user: {
              name: user.name,
              email: user.email,
            },
            stores: storeOptions,
            role: null,
          },
          { status: 200 }
        )
      }
      
      if (errorMessage === 'STORE_ACCESS_DENIED') {
        return NextResponse.json({ error: 'Accès au magasin refusé' }, { status: 403 })
      }
      
      // Other errors
      console.error('Error in getCurrentStore:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération du magasin' }, { status: 500 })
    }

    if (!store || !storeMember) {
      return NextResponse.json(
        {
          user: {
            name: user.name,
            email: user.email,
          },
          store: null,
          role: null,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        user: {
          name: user.name,
          email: user.email,
        },
        store: {
          name: store.name,
        },
        role: {
          code: storeMember.role,
          label: roleLabel || storeMember.role,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des informations' }, { status: 500 })
  }
}
