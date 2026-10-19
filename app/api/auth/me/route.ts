import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { requireActiveUser } from "@/lib/auth-helpers"

export async function GET() {
  const session = await requireActiveUser()

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      active: session.user.active,
    },
  })
}
