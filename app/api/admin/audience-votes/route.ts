import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// This route depends on the session cookie (via headers()) and query params,
// so it must run on every request — never cached or pre-rendered.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const round = searchParams.get("round")
    const debateId = searchParams.get("debateId")
    const pgp = searchParams.get("pgp")
    const section = searchParams.get("section")
    const search = searchParams.get("search")

    // Build where clause for debate votes
    const debateVoteWhereClause: any = {}

    // Round filter - need to filter through debate relation
    if (round && round !== "all") {
      debateVoteWhereClause.debate = {
        round: parseInt(round),
      }
    }

    // Debate filter
    if (debateId && debateId !== "all") {
      debateVoteWhereClause.debateId = debateId
    }

    // User filters
    const userWhereClause: any = {}

    if (pgp && pgp !== "all") {
      userWhereClause.pgp = pgp
    }

    if (section && section !== "all") {
      userWhereClause.section = section
    }

    if (search) {
      userWhereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Only add user filter if any user filters are applied
    if (Object.keys(userWhereClause).length > 0) {
      debateVoteWhereClause.user = userWhereClause
    }

    // Get debate votes (this is the only vote type now)
    const debateVotes = await prisma.debateVote.findMany({
      where: debateVoteWhereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            pgp: true,
            section: true,
            role: true,
            createdAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        debate: {
          select: {
            id: true,
            round: true,
            debateNumber: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get voting control data
    const votingControls = await prisma.votingControl.findMany()

    // Create maps
    const votingControlMap = new Map()
    votingControls.forEach((vc) => {
      votingControlMap.set(vc.debateId, vc)
    })

    // Get unique PGP and section values for filters
    const uniquePgps = await prisma.user.findMany({
      where: { pgp: { not: null } },
      select: { pgp: true },
      distinct: ["pgp"],
    })

    const uniqueSections = await prisma.user.findMany({
      where: { section: { not: null } },
      select: { section: true },
      distinct: ["section"],
    })

    // Format debate votes
    const formattedVotes = debateVotes.map((vote) => ({
      id: vote.id,
      type: "debate",
      round: vote.debate.round,
      debateInfo: {
        id: vote.debate.id,
        number: vote.debate.debateNumber,
        name: vote.debate.name,
      },
      votedAt: vote.createdAt,
      voter: {
        id: vote.user.id,
        name: vote.user.name || "Anonymous",
        email: vote.user.email,
        pgp: vote.user.pgp || null,
        section: vote.user.section || null,
        role: vote.user.role,
        registeredAt: vote.user.createdAt,
      },
      team: {
        id: vote.team.id,
        name: vote.team.name,
      },
      votingSession: votingControlMap.get(vote.debateId)
        ? {
            startTime: votingControlMap.get(vote.debateId).startTime,
            endTime: votingControlMap.get(vote.debateId).endTime,
            wasActive: votingControlMap.get(vote.debateId).isActive,
          }
        : null,
    }))

    // Get summary statistics
    const summary = {
      totalVotes: formattedVotes.length,
      debateVotes: formattedVotes.length,
      uniqueVoters: new Set(formattedVotes.map((v) => v.voter.id)).size,
      votesPerRound: {} as Record<number, number>,
      votersPerRound: {} as Record<number, number>,
      votesPerPgp: {} as Record<string, number>,
      votesPerSection: {} as Record<string, number>,
    }

    formattedVotes.forEach((vote) => {
      // Count votes per round
      summary.votesPerRound[vote.round] =
        (summary.votesPerRound[vote.round] || 0) + 1

      // Count votes per PGP
      if (vote.voter.pgp) {
        summary.votesPerPgp[vote.voter.pgp] =
          (summary.votesPerPgp[vote.voter.pgp] || 0) + 1
      }

      // Count votes per Section
      if (vote.voter.section) {
        summary.votesPerSection[vote.voter.section] =
          (summary.votesPerSection[vote.voter.section] || 0) + 1
      }
    })

    // Count unique voters per round
    const votersByRound: Record<number, Set<string>> = {}
    formattedVotes.forEach((vote) => {
      if (!votersByRound[vote.round]) {
        votersByRound[vote.round] = new Set()
      }
      votersByRound[vote.round].add(vote.voter.id)
    })

    Object.entries(votersByRound).forEach(([round, voters]) => {
      summary.votersPerRound[parseInt(round)] = voters.size
    })

    // Get all debates for filter options
    const debates = await prisma.debate.findMany({
      select: {
        id: true,
        round: true,
        debateNumber: true,
        name: true,
      },
      orderBy: [{ round: "asc" }, { debateNumber: "asc" }],
    })

    // Prepare filter options
    const filterOptions = {
      pgps: uniquePgps.map((p) => p.pgp).filter(Boolean),
      sections: uniqueSections.map((s) => s.section).filter(Boolean),
      rounds: [1, 2],
      debates: debates.map((d) => ({
        id: d.id,
        round: d.round,
        number: d.debateNumber,
        name: d.name || `Debate ${d.debateNumber}`,
      })),
    }

    return NextResponse.json({
      votes: formattedVotes,
      summary,
      filters: {
        round: round || "all",
        debateId: debateId || "all",
        pgp: pgp || "all",
        section: section || "all",
        search: search || "",
      },
      filterOptions,
    })
  } catch (error) {
    console.error("Error fetching audience votes:", error)
    return NextResponse.json(
      { error: "Error fetching audience votes" },
      { status: 500 }
    )
  }
}