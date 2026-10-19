import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      // NextAuth expects an empty object when no session exists, not null
      return NextResponse.json({})
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error("Error fetching session:", error)
    // Return empty object on error as per NextAuth spec
    return NextResponse.json({})
  }
}
