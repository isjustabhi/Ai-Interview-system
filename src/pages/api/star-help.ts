import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonCompletion } from "@/services/openaiService";
import { InterviewQuestion } from "@/types/interview";

type StarGuide = {
  situation: string;
  task: string;
  action: string;
  result: string;
  starterAnswer: string;
};

const fallbackGuide = (question: InterviewQuestion): StarGuide => ({
  situation: "In my recent role, I worked on a project relevant to this question and team goals.",
  task: "I was responsible for delivering a clear outcome under timeline and quality constraints.",
  action: "I broke down the problem, aligned stakeholders, executed a plan, and iterated using feedback.",
  result: "The outcome improved delivery quality and measurable impact for users or the business.",
  starterAnswer: `Situation: In my recent role, I handled a challenge related to "${question.prompt}".
Task: I needed to deliver a reliable result with clear ownership.
Action: I defined scope, collaborated with stakeholders, and executed in milestones.
Result: We achieved measurable impact and I captured lessons to improve future execution.`
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { jdText, resumeText, question } = req.body as {
    jdText: string;
    resumeText: string;
    question: InterviewQuestion;
  };

  const fallback = { guide: fallbackGuide(question) };
  const data = await safeJsonCompletion<{ guide: StarGuide }>(
    "You are an interview coach. Generate STAR-format starter responses. Return strict JSON only.",
    `Create a STAR guide and starter answer for this interview question using the JD and resume context.
Return:
{
  "guide": {
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "...",
    "starterAnswer": "4-8 sentence STAR answer"
  }
}
Job Description:
${jdText}
Resume:
${resumeText}
Question:
${JSON.stringify(question)}`,
    fallback
  );

  return res.status(200).json({ guide: data.guide || fallback.guide });
}
