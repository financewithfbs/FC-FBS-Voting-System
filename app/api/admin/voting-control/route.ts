import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET current voting status for all debates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    // Get all debates with their voting control
    const debates = await prisma.debate.findMany({
      include: {
        votingControl: true,
        teams: {
          include: {
            team: true
          }
        }
      },
      orderBy: [
        { round: 'asc' },
        { debateNumber: 'asc' }
      ]
    })

    // Format response
    const formattedDebates = debates.map(debate => ({
      id: debate.id,
      round: debate.round,
      debateNumber: debate.debateNumber,
      name: debate.name,
      status: debate.status,
      teams: debate.teams.map(dt => ({
        id: dt.team.id,
        name: dt.team.name
      })),
      votingControl: debate.votingControl ? {
        isActive: debate.votingControl.isActive,
        startTime: debate.votingControl.startTime,
        endTime: debate.votingControl.endTime
      } : {
        isActive: false,
        startTime: null,
        endTime: null
      }
    }))

    // For non-admin users, return only active status
    if (session.user?.role !== "ADMIN") {
      const publicData = formattedDebates.map(d => ({
        debateId: d.id,
        round: d.round,
        debateNumber: d.debateNumber,
        isActive: d.votingControl.isActive,
        teams: d.teams
      }))
      return NextResponse.json(publicData)
    }

    return NextResponse.json(formattedDebates)
  } catch (error) {
    console.error("Error fetching voting controls:", error)
    return NextResponse.json(
      { error: "Error fetching voting controls" },
      { status: 500 }
    )
  }
}

// POST update voting status for a debate (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { debateId, isActive } = await req.json()

    if (!debateId) {
      return NextResponse.json(
        { error: "Debate ID is required" },
        { status: 400 }
      )
    }

    // Update or create voting control
    const votingControl = await prisma.votingControl.upsert({
      where: { debateId },
      update: {
        isActive,
        startTime: isActive ? new Date() : null,
        endTime: !isActive ? new Date() : null
      },
      create: {
        debateId,
        isActive,
        startTime: isActive ? new Date() : null,
        endTime: !isActive ? new Date() : null
      }
    })

    // Update debate status
    await prisma.debate.update({
      where: { id: debateId },
      data: {
        status: isActive ? "ACTIVE" : "UPCOMING"
      }
    })

    return NextResponse.json(votingControl)
  } catch (error) {
    console.error("Error updating voting control:", error)
    return NextResponse.json(
      { error: "Error updating voting control" },
      { status: 500 }
    )
  }
}