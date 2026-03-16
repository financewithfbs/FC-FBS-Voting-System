import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET voting status for a debate
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

    const votingControl = await prisma.votingControl.findUnique({
      where: { debateId }
    })

    return NextResponse.json(votingControl || { isActive: false })
  } catch (error) {
    console.error("Error fetching debate control:", error)
    return NextResponse.json(
      { error: "Error fetching debate control" },
      { status: 500 }
    )
  }
}

// POST toggle voting for a debate (admin only)
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
    console.error("Error updating debate control:", error)
    return NextResponse.json(
      { error: "Error updating debate control" },
      { status: 500 }
    )
  }
}