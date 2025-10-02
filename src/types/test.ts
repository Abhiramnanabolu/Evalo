export enum TestStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    CLOSED = "CLOSED",
    ARCHIVED = "ARCHIVED",
}

export enum QuestionOrder {
    SEQUENTIAL = "SEQUENTIAL",
    SHUFFLED = "SHUFFLED",
}

export enum ResultVisibility {
    INSTANT = "INSTANT",
    AFTER_TEST = "AFTER_TEST",
    HIDDEN = "HIDDEN",
}

export enum QuestionType {
    MCQ_SINGLE = "MCQ_SINGLE",
    MCQ_MULTIPLE = "MCQ_MULTIPLE",
    TRUE_FALSE = "TRUE_FALSE",
    SHORT_ANSWER = "SHORT_ANSWER",
    NUMERIC = "NUMERIC",
}

export interface User {
    id: string;
    email: string;
    name: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Test {
    id: string;
    title: string;
    description: string;
    duration: number;
    status: TestStatus;
    startTime: Date;
    endTime: Date;
    allowBack: boolean;
    questionOrder: QuestionOrder;
    attemptLimit: number;
    retakeCooldown: number;
    resultVisibility: ResultVisibility;
    passPercentage: number;
    creator: User;
    creatorId: string;
    sections: Section[];
    questions: Question[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Section {
    id: string;
    test: Test;
    testId: string;
    title: string;
    description: string;
    duration: number;
    order: number;
    questions: Question[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Question {
    id: string;
    test: Test;
    testId: string;
    type: QuestionType;
    title: string;
    description: string;
    imageUrl: string;
    points: number;
    negativePoints: number;
    order: number;
    options: Option[];
    correctAnswer: string;
    explanation: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Option {
    id: string;
    question: Question;
    questionId: string;
    text: string;
    imageUrl: string;
    isCorrect: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}