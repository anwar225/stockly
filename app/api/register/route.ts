import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma } from '@/lib/generated/prisma/client'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Schéma de validation Zod
const registerSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .transform((val) => val.trim().toLowerCase())
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Email invalide",
    }),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, {
      message: "Le mot de passe ne peut pas dépasser 72 octets",
    }),
  confirmPassword: z.string(),
  organizationName: z
    .string()
    .min(2, "Le nom de l'organisation doit contenir au moins 2 caractères")
    .max(100, "Le nom de l'organisation ne peut pas dépasser 100 caractères"),
  storeName: z
    .string()
    .min(2, "Le nom du magasin doit contenir au moins 2 caractères")
    .max(100, "Le nom du magasin ne peut pas dépasser 100 caractères"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 registration attempts per IP per hour
    const clientIp = getClientIp(request)
    
    // Reject requests without identifiable IP (fail-secure)
    if (clientIp === 'reject') {
      console.error('Unable to identify client IP for rate limiting')
      return NextResponse.json(
        { error: "Service temporairement indisponible. Veuillez réessayer ultérieurement." },
        { status: 503 }
      )
    }
    
    try {
      const rateLimitResult = await checkRateLimit(clientIp, 5, 3600000) // 5 requests per hour

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: "Trop de tentatives d'inscription. Veuillez réessayer dans une heure." },
          { status: 429 }
        )
      }
    } catch (rateLimitError) {
      // Handle rate limiting errors
      if (rateLimitError instanceof Error) {
        if (rateLimitError.message === 'RATE_LIMITING_UNAVAILABLE' || 
            rateLimitError.message === 'RATE_LIMITING_UNCONFIGURED' ||
            rateLimitError.message === 'RATE_LIMITING_ERROR') {
          console.error('Rate limiting error:', rateLimitError.message)
          return NextResponse.json(
            { error: "Service temporairement indisponible. Veuillez réessayer ultérieurement." },
            { status: 503 }
          )
        }
      }
      // Re-throw unexpected errors
      throw rateLimitError
    }

    const body = await request.json()

    // Validation des données avec Zod
    const validatedData = registerSchema.parse(body)

    const { email, name, password, organizationName, storeName } = validatedData

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      )
    }

    // Hasher le mot de passe avec bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10)

    // Créer les entités dans une transaction atomique
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer Organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
        },
      })

      // 2. Créer User
      const user = await tx.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
          organizationId: organization.id,
          active: true,
          // role: Laisser la valeur par défaut (EMPLOYEE) car déprédié
        },
      })

      // 3. Créer Store
      const store = await tx.store.create({
        data: {
          name: storeName,
          organizationId: organization.id,
        },
      })

      // 4. Créer StoreMember avec rôle OWNER
      const storeMember = await tx.storeMember.create({
        data: {
          userId: user.id,
          storeId: store.id,
          role: 'OWNER',
        },
      })

      return { organization, user, store, storeMember }
    })

    // Log de l'inscription (sans données sensibles)
    console.log(`New registration: ${email}, Organization: ${result.organization.name}, Store: ${result.store.name}`)

    // Retourner 201 Created sans exposer de données sensibles
    return NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès",
      },
      { status: 201 }
    )
  } catch (error) {
    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    // Gestion des erreurs Prisma (contrainte unique P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        )
      }
    }

    // Gestion des autres erreurs
    console.error('Error during registration:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    )
  }
}
