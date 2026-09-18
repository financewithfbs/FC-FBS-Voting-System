import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// This route depends on the session cookie (via headers()),
// so it must run on every request — never cached or pre-rendered.
export const dynamic = "force-dynamic"

// GET all debates (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    console.log("Fetching debates...")

    const debates = await prisma.debate.findMany({
      include: {
        teams: {
          include: {
            team: true,
          },
        },
        votes: true,
        panelistScores: true,
        votingControl: true,
      },
      orderBy: [{ round: "asc" }, { debateNumber: "asc" }],
    })

    console.log(`Found ${debates.length} debates`)
    return NextResponse.json(debates)
  } catch (error) {
    console.error("Error fetching debates:", error)
    return NextResponse.json(
      {
        error:
          "Error fetching debates: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    )
  }
}

// POST create new debate
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { round, debateNumber, name } = await req.json()

    if (!round || !debateNumber) {
      return NextResponse.json(
        { error: "Round and debate number are required" },
        { status: 400 }
      )
    }

    console.log(`Creating debate: Round ${round}, Number ${debateNumber}`)

    // Check if debate already exists
    const existingDebate = await prisma.debate.findFirst({
      where: {
        round,
        debateNumber,
      },
    })

    if (existingDebate) {
      return NextResponse.json(
        { error: `Debate ${debateNumber} for round ${round} already exists` },
        { status: 400 }
      )
    }

    // Create debate without teams initially
    const debate = await prisma.debate.create({
      data: {
        round,
        debateNumber,
        name: name || `Debate ${debateNumber}`,
        status: "UPCOMING",
      },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    })

    return NextResponse.json(debate)
  } catch (error) {
    console.error("Error creating debate:", error)
    return NextResponse.json(
      {
        error:
          "Error creating debate: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    )
  }
}

// PUT update debate (assign teams, update status)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { id, teamIds, name, status } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Debate ID is required" },
        { status: 400 }
      )
    }

    console.log(`Updating debate: ${id}`)

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (status) updateData.status = status

    // Handle team assignment if teamIds provided
    if (teamIds && teamIds.length > 0) {
      if (teamIds.length !== 2) {
        return NextResponse.json(
          { error: "Each debate must have exactly 2 teams" },
          { status: 400 }
        )
      }

      // First delete existing teams
      await prisma.debateTeam.deleteMany({
        where: { debateId: id },
      })

      // Then create new team assignments
      await prisma.debateTeam.createMany({
        data: teamIds.map((teamId: string) => ({
          debateId: id,
          teamId,
        })),
      })
    }

    // Update debate
    const debate = await prisma.debate.update({
      where: { id },
      data: updateData,
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    })

    return NextResponse.json(debate)
  } catch (error) {
    console.error("Error updating debate:", error)
    return NextResponse.json(
      {
        error:
          "Error updating debate: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    )
  }
}