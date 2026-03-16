import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET panelist scores for a specific debate
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const debateId = searchParams.get("debateId");

    if (!debateId) {
      return NextResponse.json(
        { error: "Debate ID is required" },
        { status: 400 },
      );
    }

    console.log("Fetching scores for debate:", debateId);

    const scores = await prisma.panelistScore.findMany({
      where: { debateId },
      include: {
        team: {
          select: { name: true, id: true },
        },
      },
    });

    console.log(`Found ${scores.length} scores`);
    return NextResponse.json(scores);
  } catch (error) {
    console.error("Error fetching panelist scores:", error);
    return NextResponse.json(
      {
        error:
          "Error fetching panelist scores: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

// POST save panelist scores for a debate
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body);

    const { debateId, scores } = body;

    if (!debateId) {
      return NextResponse.json(
        { error: "Debate ID is required" },
        { status: 400 },
      );
    }

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: "Scores array is required" },
        { status: 400 },
      );
    }

    if (scores.length === 0) {
      return NextResponse.json(
        { error: "At least one score is required" },
        { status: 400 },
      );
    }

    console.log(`Processing ${scores.length} scores for debate ${debateId}`);

    // Verify the debate exists
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: { teams: true },
    });

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    console.log("Debate found:", debate.id);

    // Delete existing scores for this debate
    const deleteResult = await prisma.panelistScore.deleteMany({
      where: { debateId },
    });
    console.log(`Deleted ${deleteResult.count} existing scores`);

    // Create new scores (without panelistId)
    const createdScores = [];
    for (const score of scores) {
      try {
        // Verify team exists
        const team = await prisma.team.findUnique({
          where: { id: score.teamId },
        });

        if (!team) {
          console.error(`Team ${score.teamId} not found`);
          continue;
        }

        // Create new score with proper relation connections
        const newScore = await prisma.panelistScore.create({
          data: {
            score: score.score,
            debate: {
              connect: { id: debateId },
            },
            team: {
              connect: { id: score.teamId },
            },
            // panelist is optional, so we can omit it
          },
        });
        createdScores.push(newScore);
        console.log(`Created score for team ${score.teamId}: ${score.score}`);
      } catch (createError) {
        console.error("Error creating individual score:", createError);
        throw createError;
      }
    }

    console.log(`Successfully saved ${createdScores.length} scores`);

    return NextResponse.json({
      success: true,
      message: "Scores saved successfully",
      count: createdScores.length,
    });
  } catch (error) {
    console.error("Error saving panelist scores:", error);

    let errorMessage = "Error saving panelist scores";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
