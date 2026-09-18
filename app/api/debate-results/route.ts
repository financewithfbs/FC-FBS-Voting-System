import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This route depends on query params via request.url,
// so it must run on every request — never cached or pre-rendered.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const round = parseInt(searchParams.get("round") || "1")

    console.log(`Fetching debate results for round ${round}`)

    // Get all debates for the round
    const debates = await prisma.debate.findMany({
      where: { round },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
        votes: true,
        panelistScores: true,
      },
      orderBy: { debateNumber: "asc" },
    })

    console.log(`Found ${debates.length} debates`)

    // Calculate results for each debate
    const debateResults = await Promise.all(
      debates.map(async (debate) => {
        const teamsWithScores = await Promise.all(
          debate.teams.map(async (dt) => {
            // Get panelist scores for this team in this debate
            const panelistScores = debate.panelistScores.filter(
              (ps) => ps.teamId === dt.teamId
            )
            const avgPanelistScore =
              panelistScores.length > 0
                ? panelistScores.reduce((sum, ps) => sum + ps.score, 0) /
                  panelistScores.length
                : 0

            // Get audience votes for this team in this debate
            const audienceVotes = debate.votes.filter(
              (v) => v.teamId === dt.teamId
            ).length

            // Calculate weighted score (70% panelist, 30% audience)
            const panelistWeighted = avgPanelistScore * 0.7
            const audienceWeighted = audienceVotes * 0.3
            const totalScore = panelistWeighted + audienceWeighted

            return {
              teamId: dt.teamId,
              teamName: dt.team.name,
              panelistScore: Number(avgPanelistScore.toFixed(2)),
              audienceVotes,
              panelistWeighted: Number(panelistWeighted.toFixed(2)),
              audienceWeighted: Number(audienceWeighted.toFixed(2)),
              totalScore: Number(totalScore.toFixed(2)),
            }
          })
        )

        // Sort teams by score and determine winner
        teamsWithScores.sort((a, b) => b.totalScore - a.totalScore)
        const winner = teamsWithScores[0]

        return {
          debateId: debate.id,
          debateNumber: debate.debateNumber,
          name: debate.name || `Debate ${debate.debateNumber}`,
          status: debate.status,
          teams: teamsWithScores,
          winner: winner
            ? {
                teamId: winner.teamId,
                teamName: winner.teamName,
                score: winner.totalScore,
              }
            : null,
        }
      })
    )

    // For round 2, also calculate overall winner
    if (round === 2) {
      const winners = debateResults.map((d) => d.winner).filter(Boolean)
      winners.sort((a, b) => (b?.score || 0) - (a?.score || 0))

      return NextResponse.json({
        debates: debateResults,
        winners: {
          first: winners[0] || null,
          second: winners[1] || null,
          third: winners[2] || null,
        },
        round,
      })
    }

    return NextResponse.json({
      debates: debateResults,
      round,
    })
  } catch (error) {
    console.error("Error calculating debate results:", error)
    return NextResponse.json(
      {
        error:
          "Error calculating results: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    )
  }
}