import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const testId = params.id

    // Validate test ID
    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      )
    }

    // Fetch the test from database
    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        creatorId: session.user.id, // Ensure user can only access their own tests
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        }
      },
    })

    // Check if test exists
    if (!test) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        status: test.status,
        startTime: test.startTime,
        endTime: test.endTime,
        questionOrder: test.questionOrder,
        attemptLimit: test.attemptLimit,
        resultVisibility: test.resultVisibility,
        passPercentage: test.passPercentage,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
        questions: test.questions,
      },
    })

  } catch (error) {
    console.error("Error fetching test:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

