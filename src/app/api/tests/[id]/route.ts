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

export async function PUT(
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

    // Parse the request body
    const body = await request.json()
    const {
      title,
      description,
      duration,
      startTime,
      endTime,
      status,
      questionOrder,
      attemptLimit,
      resultVisibility,
      passPercentage,
      sections,
      questions,
    } = body

    // Validate required fields
    if (!title || !duration) {
      return NextResponse.json(
        { error: "Missing required fields: title and duration are required" },
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

    // Validate pass percentage if provided
    let passPercentageNum = null
    if (passPercentage !== undefined && passPercentage !== null && passPercentage !== "") {
      passPercentageNum = parseFloat(passPercentage)
      if (isNaN(passPercentageNum) || passPercentageNum < 0 || passPercentageNum > 100) {
        return NextResponse.json(
          { error: "Pass percentage must be a number between 0 and 100" },
          { status: 400 }
        )
      }
    }

    // Validate attempt limit if provided
    let attemptLimitNum = null
    if (attemptLimit !== undefined && attemptLimit !== null && attemptLimit !== "") {
      attemptLimitNum = parseInt(attemptLimit)
      if (isNaN(attemptLimitNum) || attemptLimitNum < 1 || attemptLimitNum > 10) {
        return NextResponse.json(
          { error: "Attempt limit must be a number between 1 and 10" },
          { status: 400 }
        )
      }
    }

    // Validate date times
    let startTimeDate = null
    let endTimeDate = null

    if (startTime) {
      startTimeDate = new Date(startTime)
      if (isNaN(startTimeDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start time" },
          { status: 400 }
        )
      }
    }

    if (endTime) {
      endTimeDate = new Date(endTime)
      if (isNaN(endTimeDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end time" },
          { status: 400 }
        )
      }
    }

    // Validate that end time is after start time
    if (startTimeDate && endTimeDate && startTimeDate >= endTimeDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // Map result visibility values to enum
    const resultVisibilityMap: Record<string, string> = {
      "INSTANT": "INSTANT",
      "AFTER_TEST": "AFTER_TEST",
      "HIDDEN": "HIDDEN"
    }

    const mappedResultVisibility = resultVisibilityMap[resultVisibility] || "AFTER_TEST"

    // Start a transaction to update test and related data
    const result = await prisma.$transaction(async (tx) => {
      // Update the test
      const updatedTest = await tx.test.update({
        where: {
          id: testId,
          creatorId: session.user.id, // Ensure user can only update their own tests
        },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          duration: durationNum,
          startTime: startTimeDate,
          endTime: endTimeDate,
          status: status || "DRAFT",
          questionOrder: questionOrder || "SEQUENTIAL",
          attemptLimit: attemptLimitNum,
          resultVisibility: mappedResultVisibility as any,
          passPercentage: passPercentageNum,
          hasSections: sections && sections.length > 0,
        },
      })

      // If test has sections, update them
      if (sections && sections.length > 0) {
        // Delete existing sections and questions for this test
        await tx.question.deleteMany({
          where: { testId: testId }
        })
        await tx.section.deleteMany({
          where: { testId: testId }
        })

        // Create new sections and their questions
        for (const sectionData of sections) {
          const section = await tx.section.create({
            data: {
              testId: testId,
              title: sectionData.title,
              description: sectionData.description || null,
              duration: sectionData.duration || 0,
              order: sectionData.order || 0,
            },
          })

          // Create questions for this section
          if (sectionData.questions && sectionData.questions.length > 0) {
            for (const questionData of sectionData.questions) {
              const question = await tx.question.create({
                data: {
                  testId: testId,
                  sectionId: section.id,
                  type: questionData.type,
                  title: questionData.title,
                  description: questionData.description || null,
                  imageUrl: questionData.imageUrl || null,
                  points: questionData.points || 1,
                  negativePoints: questionData.negativePoints || 0,
                  order: questionData.order || 0,
                  correctAnswer: questionData.correctAnswer || null,
                  explanation: questionData.explanation || null,
                },
              })

              // Create options for this question if they exist
              if (questionData.options && questionData.options.length > 0) {
                for (const optionData of questionData.options) {
                  await tx.option.create({
                    data: {
                      questionId: question.id,
                      text: optionData.text,
                      imageUrl: optionData.imageUrl || null,
                      isCorrect: optionData.isCorrect || false,
                      order: optionData.order || 0,
                    },
                  })
                }
              }
            }
          }
        }
      } else if (questions && questions.length > 0) {
        // If test has standalone questions, update them
        // Delete existing questions for this test
        await tx.question.deleteMany({
          where: { testId: testId }
        })

        // Create new standalone questions
        for (const questionData of questions) {
          const question = await tx.question.create({
            data: {
              testId: testId,
              sectionId: null,
              type: questionData.type,
              title: questionData.title,
              description: questionData.description || null,
              imageUrl: questionData.imageUrl || null,
              points: questionData.points || 1,
              negativePoints: questionData.negativePoints || 0,
              order: questionData.order || 0,
              correctAnswer: questionData.correctAnswer || null,
              explanation: questionData.explanation || null,
            },
          })

          // Create options for this question if they exist
          if (questionData.options && questionData.options.length > 0) {
            for (const optionData of questionData.options) {
              await tx.option.create({
                data: {
                  questionId: question.id,
                  text: optionData.text,
                  imageUrl: optionData.imageUrl || null,
                  isCorrect: optionData.isCorrect || false,
                  order: optionData.order || 0,
                },
              })
            }
          }
        }
      }

      // Fetch the updated test with all relations
      const finalTest = await tx.test.findFirst({
        where: {
          id: testId,
          creatorId: session.user.id,
        },
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true,
                },
              },
            },
          },
          questions: {
            include: {
              options: true,
            },
          },
        },
      })

      return finalTest
    })

    if (!result) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Test updated successfully",
      test: {
        id: result.id,
        title: result.title,
        description: result.description,
        duration: result.duration,
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        questionOrder: result.questionOrder,
        attemptLimit: result.attemptLimit,
        resultVisibility: result.resultVisibility,
        passPercentage: result.passPercentage,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        sections: result.sections,
        questions: result.questions,
      },
    })

  } catch (error) {
    console.error("Error updating test:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

