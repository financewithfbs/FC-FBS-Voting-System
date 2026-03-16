import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET existing scores
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const debateId = searchParams.get("debateId")

    console.log("Fetching panelist scores", debateId ? `for debate ${debateId}` : "for all debates")

    const whereClause: any = {}
    if (debateId) {
      whereClause.debateId = debateId
    }

    const scores = await prisma.panelistScore.findMany({
      where: whereClause,
      include: {
        team: {
          select: { name: true }
        },
        debate: {
          select: { 
            round: true, 
            debateNumber: true,
            name: true 
          }
        }
      }
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json(
      { error: "Error fetching scores: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}

// POST save panelist scores
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { debateId, scores } = await req.json()

    if (!debateId || !scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    console.log(`Saving ${scores.length} scores for debate ${debateId}`)

    // Delete existing scores for this debate
    await prisma.panelistScore.deleteMany({
      where: { debateId }
    })

    // Create new scores
    const createdScores = await prisma.$transaction(
      scores.map((score: { teamId: string; score: number }) =>
        prisma.panelistScore.create({
          data: {
            debateId,
            teamId: score.teamId,
            panelistId: session.user.id,
            score: score.score
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: "Scores saved successfully",
      count: createdScores.length 
    })
  } catch (error) {
    console.error("Error saving scores:", error)
    return NextResponse.json(
      { error: "Error saving scores: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}