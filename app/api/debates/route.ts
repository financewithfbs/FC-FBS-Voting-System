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
    const round = parseInt(searchParams.get("round") || "1")

    const debates = await prisma.debate.findMany({
      where: { round },
      include: {
        teams: {
          include: {
            team: true
          }
        },
        votingControl: true
      },
      orderBy: { debateNumber: 'asc' }
    })

    // Format for audience view (don't send sensitive data)
    const formattedDebates = debates.map(debate => ({
      id: debate.id,
      round: debate.round,
      debateNumber: debate.debateNumber,
      name: debate.name,
      status: debate.status,
      teams: debate.teams.map(dt => ({
        team: {
          id: dt.team.id,
          name: dt.team.name
        }
      })),
      votingControl: debate.votingControl ? {
        isActive: debate.votingControl.isActive
      } : null
    }))

    return NextResponse.json(formattedDebates)
  } catch (error) {
    console.error("Error fetching debates:", error)
    return NextResponse.json(
      { error: "Error fetching debates" },
      { status: 500 }
    )
  }
}