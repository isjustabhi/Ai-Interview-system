export type InterviewQuestion = {
  id: string;
  category: "technical" | "behavioral" | "situational" | "experience";
  prompt: string;
  expectedFocus: string;
};

export type InterviewAnswer = {
  questionId: string;
  answer: string;
  skipped?: boolean;
};

export type ScoreBreakdown = {
  technical: number;
  softSkills: number;
  culturalFit: number;
  communication: number;
};

export type InterviewFeedback = {
  overallMatch: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  breakdown: ScoreBreakdown;
  perQuestion: Array<{
    questionId: string;
    score: number;
    feedback: string;
  }>;
};