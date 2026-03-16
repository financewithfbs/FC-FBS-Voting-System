import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 })
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    return NextResponse.json({
      session: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      databaseUser: user,
      exists: !!user
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error checking user" }, { status: 500 })
  }
}