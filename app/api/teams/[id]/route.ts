import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// For Next.js 14, params are not promises
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("PUT request received for ID:", params.id)
  
  try {
    const id = params.id
    
    if (!id) {
      console.log("No ID provided")
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      )
    }

    console.log("Checking session...")
    const session = await getServerSession(authOptions)
    console.log("Session:", session?.user?.email, session?.user?.role)
    
    if (!session || session.user?.role !== "ADMIN") {
      console.log("Unauthorized - not admin")
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log("Request body:", body)
    const { name, description } = body
    
    if (!name) {
      console.log("No name provided")
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }

    // Check if team exists
    console.log("Checking if team exists with ID:", id)
    const existingTeam = await prisma.team.findUnique({
      where: { id }
    })

    if (!existingTeam) {
      console.log("Team not found with ID:", id)
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    console.log("Updating team...")
    const team = await prisma.team.update({
      where: { id },
      data: { 
        name, 
        description: description || null 
      }
    })
    
    console.log("Team updated successfully:", team)
    return NextResponse.json(team)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json(
      { error: "Error updating team: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("DELETE request received for ID:", params.id)
  
  try {
    const id = params.id
    
    if (!id) {
      console.log("No ID provided")
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      )
    }

    console.log("Checking session...")
    const session = await getServerSession(authOptions)
    console.log("Session:", session?.user?.email, session?.user?.role)
    
    if (!session || session.user?.role !== "ADMIN") {
      console.log("Unauthorized - not admin")
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Check if team exists
    console.log("Checking if team exists with ID:", id)
    const existingTeam = await prisma.team.findUnique({
      where: { id }
    })

    if (!existingTeam) {
      console.log("Team not found with ID:", id)
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    console.log("Deleting related records and team...")
    // First delete related records (debate votes, debate teams, and panelist scores)
    await prisma.$transaction([
      // Delete debate votes where this team is voted for
      prisma.debateVote.deleteMany({
        where: { teamId: id }
      }),
      // Delete debate team associations
      prisma.debateTeam.deleteMany({
        where: { teamId: id }
      }),
      // Delete panelist scores for this team
      prisma.panelistScore.deleteMany({
        where: { teamId: id }
      }),
      // Finally delete the team
      prisma.team.delete({
        where: { id }
      })
    ])
    
    console.log("Team deleted successfully")
    return NextResponse.json({ success: true, message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json(
      { error: "Error deleting team: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}