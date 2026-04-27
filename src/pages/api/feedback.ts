import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonCompletion } from "@/services/openaiService";
import { InterviewAnswer, InterviewFeedback, InterviewQuestion } from "@/types/interview";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function fallbackFeedback(questions: InterviewQuestion[], answers: InterviewAnswer[]): InterviewFeedback {
  const answered = answers.filter((a) => !a.skipped && a.answer.trim()).length;
  const total = questions.length || 0;
  const noAnswersSubmitted = total > 0 && answered === 0;
  const coverage = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  if (noAnswersSubmitted) {
    return {
      overallMatch: 0,
      strengths: ["Interview setup completed successfully."],
      improvements: [
        "No answers were submitted, so we could not evaluate fit.",
        "Answer each question with specific examples from your experience.",
        "Use STAR format to improve clarity and scoring depth."
      ],
      recommendations: [
        "Retry and answer all questions for an accurate match score.",
        "Aim for 4-6 sentence responses with concrete outcomes.",
        "Map each answer to job requirements explicitly."
      ],
      breakdown: {
        technical: 0,
        softSkills: 0,
        culturalFit: 0,
        communication: 0
      },
      perQuestion: questions.map((q, i) => ({
        questionId: q.id || String(i + 1),
        score: 0,
        feedback: "No answer submitted for this question."
      }))
    };
  }

  return {
    overallMatch: clamp(coverage),
    strengths: [
      "Good baseline role awareness",
      "Clear intent in several responses",
      "Some evidence of practical experience"
    ],
    improvements: [
      "Add metrics and outcomes in examples",
      "Use STAR structure consistently",
      "Connect experience explicitly to JD priorities"
    ],
    recommendations: [
      "Practice 2-minute concise response framing",
      "Prepare examples mapped to top 5 required skills",
      "Quantify impact with numbers wherever possible"
    ],
    breakdown: {
      technical: clamp(Math.max(45, coverage - 5)),
      softSkills: clamp(Math.max(50, coverage)),
      culturalFit: clamp(Math.max(40, coverage - 10)),
      communication: clamp(Math.max(50, coverage + 5))
    },
    perQuestion: questions.map((q, i) => ({
      questionId: q.id || String(i + 1),
      score: answers[i]?.skipped ? 35 : 65,
      feedback: answers[i]?.skipped
        ? "Question was skipped; provide a concise structured answer to improve fit."
        : "Answer is relevant but would benefit from clearer outcomes and stronger examples."
    }))
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { jdText, resumeText, questions, answers } = req.body as {
    jdText: string;
    resumeText: string;
    questions: InterviewQuestion[];
    answers: InterviewAnswer[];
  };
  const answeredCount = answers.filter((a) => !a.skipped && a.answer.trim().length > 0).length;
  const noAnswersSubmitted = questions.length > 0 && answeredCount === 0;

  const fallback = { feedback: fallbackFeedback(questions, answers) };
  const data = await safeJsonCompletion<{ feedback: InterviewFeedback }>(
    "You are an expert interview evaluator. Return strict JSON only.",
    `Evaluate interview answers against job requirements and resume. Return:
{
  "feedback": {
    "overallMatch": number (0-100),
    "strengths": string[],
    "improvements": string[],
    "recommendations": string[],
    "breakdown": { "technical": number, "softSkills": number, "culturalFit": number, "communication": number },
    "perQuestion": [{ "questionId": string, "score": number, "feedback": string }]
  }
}
Job Description:
${jdText}
Resume:
${resumeText}
Questions:
${JSON.stringify(questions)}
Answers:
${JSON.stringify(answers)}`,
    fallback
  );

  if (noAnswersSubmitted) {
    return res.status(200).json({ feedback: fallback.feedback });
  }

  return res.status(200).json({ feedback: data.feedback || fallback.feedback });
}
