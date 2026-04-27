import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InterviewAnswer, InterviewFeedback, InterviewQuestion } from "@/types/interview";

type InterviewMode = "quick" | "comprehensive";
type Difficulty = "easy" | "medium" | "hard";

type InterviewState = {
  jdText: string;
  resumeText: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  feedback: InterviewFeedback | null;
  setDocuments: (jdText: string, resumeText: string) => void;
  setSetup: (mode: InterviewMode, difficulty: Difficulty) => void;
  setQuestions: (questions: InterviewQuestion[]) => void;
  saveAnswer: (questionId: string, answer: string, skipped?: boolean) => void;
  setFeedback: (feedback: InterviewFeedback) => void;
  resetInterview: () => void;
};

const baseState = {
  jdText: "",
  resumeText: "",
  mode: "quick" as InterviewMode,
  difficulty: "medium" as Difficulty,
  questions: [],
  answers: [],
  feedback: null
};

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      ...baseState,
      setDocuments: (jdText, resumeText) => set({ jdText, resumeText }),
      setSetup: (mode, difficulty) => set({ mode, difficulty }),
      setQuestions: (questions) => set({ questions, answers: [], feedback: null }),
      saveAnswer: (questionId, answer, skipped = false) =>
        set((state) => {
          const existing = state.answers.find((a) => a.questionId === questionId);
          if (existing) {
            return {
              answers: state.answers.map((a) => (a.questionId === questionId ? { ...a, answer, skipped } : a))
            };
          }
          return { answers: [...state.answers, { questionId, answer, skipped }] };
        }),
      setFeedback: (feedback) => set({ feedback }),
      resetInterview: () => set(baseState)
    }),
    { name: "interview-store-v1" }
  )
);