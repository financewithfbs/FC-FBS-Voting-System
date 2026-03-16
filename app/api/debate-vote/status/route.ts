import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const debateId = searchParams.get("debateId")

    if (!debateId) {
      return NextResponse.json(
        { error: "Debate ID is required" },
        { status: 400 }
      )
    }

    const vote = await prisma.debateVote.findUnique({
      where: {
        debateId_userId: {
          debateId,
          userId: session.user.id
        }
      }
    })

    return NextResponse.json({ 
      hasVoted: !!vote,
      debateId
    })

  } catch (error) {
    console.error("Error checking vote status:", error)
    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 }
    )
  }
}