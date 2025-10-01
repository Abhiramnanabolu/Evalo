import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const {
      title,
      description,
      duration,
      startDateTime,
      endDateTime,
      questionOrder,
      attemptLimit,
      resultVisibility,
      passPercentage,
    } = body

    // Validate required fields
    if (!title || !duration || !passPercentage) {
      return NextResponse.json(
        { error: "Missing required fields: title, duration, and passPercentage are required" },
        { status: 400 }
      )
    }

    // Validate duration
    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 480) {
      return NextResponse.json(
        { error: "Duration must be a number between 1 and 480 minutes" },
        { status: 400 }
      )
    }

    // Validate pass percentage
    const passPercentageNum = parseFloat(passPercentage)
    if (isNaN(passPercentageNum) || passPercentageNum < 1 || passPercentageNum > 100) {
      return NextResponse.json(
        { error: "Pass percentage must be a number between 1 and 100" },
        { status: 400 }
      )
    }

    // Validate attempt limit if provided
    let attemptLimitNum = null
    if (attemptLimit && attemptLimit.trim() !== "") {
      attemptLimitNum = parseInt(attemptLimit)
      if (isNaN(attemptLimitNum) || attemptLimitNum < 1 || attemptLimitNum > 10) {
        return NextResponse.json(
          { error: "Attempt limit must be a number between 1 and 10" },
          { status: 400 }
        )
      }
    }

    // Validate date times
    let startTime = null
    let endTime = null
    
    if (startDateTime) {
      startTime = new Date(startDateTime)
      if (isNaN(startTime.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date and time" },
          { status: 400 }
        )
      }
    }

    if (endDateTime) {
      endTime = new Date(endDateTime)
      if (isNaN(endTime.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date and time" },
          { status: 400 }
        )
      }
    }

    // Validate that end time is after start time
    if (startTime && endTime && startTime >= endTime) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
    }

    // Map result visibility values to enum
    const resultVisibilityMap: Record<string, string> = {
      "immediately": "INSTANT",
      "after_submission": "AFTER_TEST", 
      "after_test_end": "AFTER_TEST",
      "never": "HIDDEN"
    }

    const mappedResultVisibility = resultVisibilityMap[resultVisibility] || "AFTER_TEST"

    // Create the test in the database
    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        duration: durationNum,
        startTime,
        endTime,
        questionOrder: questionOrder || "SEQUENTIAL",
        attemptLimit: attemptLimitNum,
        resultVisibility: mappedResultVisibility as any,
        passPercentage: passPercentageNum,
        creatorId: session.user.id,
        status: "DRAFT", // Default to draft status
      },
    })

    return NextResponse.json(
      { 
        message: "Test created successfully",
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
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error creating test:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    // Build where clause
    const where: any = {
      creatorId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    // Get tests with pagination
    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          status: true,
          startTime: true,
          endTime: true,
          questionOrder: true,
          attemptLimit: true,
          resultVisibility: true,
          passPercentage: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.test.count({ where }),
    ])

    return NextResponse.json({
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
