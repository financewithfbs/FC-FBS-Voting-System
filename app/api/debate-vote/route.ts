import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to vote" },
        { status: 401 }
      )
    }

    if (session.user?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot vote" },
        { status: 403 }
      )
    }

    const { debateId, teamId } = await req.json()

    if (!debateId || !teamId) {
      return NextResponse.json(
        { error: "Debate ID and Team ID are required" },
        { status: 400 }
      )
    }

    // Check if debate exists and is active
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        votingControl: true,
        teams: true
      }
    })

    if (!debate) {
      return NextResponse.json(
        { error: "Debate not found" },
        { status: 404 }
      )
    }

    // Check if voting is active
    if (!debate.votingControl || !debate.votingControl.isActive) {
      return NextResponse.json(
        { error: "Voting is not active for this debate" },
        { status: 400 }
      )
    }

    // Check if team is in this debate
    const isValidTeam = debate.teams.some(dt => dt.teamId === teamId)
    if (!isValidTeam) {
      return NextResponse.json(
        { error: "Invalid team for this debate" },
        { status: 400 }
      )
    }

    // Check if user has already voted in this debate
    const existingVote = await prisma.debateVote.findUnique({
      where: {
        debateId_userId: {
          debateId,
          userId: session.user.id
        }
      }
    })

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted in this debate" },
        { status: 400 }
      )
    }

    // Create vote
    const vote = await prisma.debateVote.create({
      data: {
        debateId,
        userId: session.user.id,
        teamId
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Vote cast successfully!",
      vote 
    })

  } catch (error) {
    console.error("Error casting vote:", error)
    return NextResponse.json(
      { error: "Failed to cast vote. Please try again." },
      { status: 500 }
    )
  }
}