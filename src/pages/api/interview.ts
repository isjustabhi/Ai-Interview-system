import type { NextApiRequest, NextApiResponse } from "next";
import { safeJsonCompletion } from "@/services/openaiService";
import { InterviewQuestion } from "@/types/interview";

const fallbackPool: Omit<InterviewQuestion, "id">[] = [
  {
    category: "technical",
    prompt: "Walk through a recent architecture decision you made and the tradeoffs you evaluated.",
    expectedFocus: "System design clarity, decision-making process, and measurable impact."
  },
  {
    category: "experience",
    prompt: "Which project best demonstrates your fit for this role, and why?",
    expectedFocus: "Relevance to job requirements, outcomes, and ownership."
  },
  {
    category: "technical",
    prompt: "How do you approach debugging a production issue with limited observability?",
    expectedFocus: "Structured troubleshooting, prioritization, and communication."
  },
  {
    category: "behavioral",
    prompt: "Tell me about a time you disagreed with a teammate and how you resolved it.",
    expectedFocus: "Collaboration, empathy, and conflict resolution."
  },
  {
    category: "situational",
    prompt: "If requirements are ambiguous and deadlines are fixed, how would you deliver safely?",
    expectedFocus: "Risk management, scope control, and stakeholder alignment."
  },
  {
    category: "technical",
    prompt: "How do you ensure code quality and maintainability in fast-moving projects?",
    expectedFocus: "Testing strategy, standards, and long-term thinking."
  },
  {
    category: "experience",
    prompt: "Describe a project where you improved performance or reduced cost.",
    expectedFocus: "Metrics, optimization strategy, and business impact."
  },
  {
    category: "behavioral",
    prompt: "Give an example of mentoring or helping raise team productivity.",
    expectedFocus: "Leadership behaviors, coaching style, and tangible outcomes."
  },
  {
    category: "situational",
    prompt: "How would you prioritize multiple urgent tasks from different stakeholders?",
    expectedFocus: "Prioritization framework, communication, and decision quality."
  },
  {
    category: "technical",
    prompt: "Explain how you would design a resilient API for high traffic.",
    expectedFocus: "Scalability, reliability, and failure handling."
  },
  {
    category: "behavioral",
    prompt: "Tell me about a failure and what changed in your approach afterward.",
    expectedFocus: "Ownership, learning mindset, and process improvement."
  },
  {
    category: "experience",
    prompt: "Which of your skills is strongest for this role, and how have you proven it?",
    expectedFocus: "Skill-to-role mapping and evidence-backed examples."
  }
];

const fallbackQuestions = (count: number): InterviewQuestion[] =>
  fallbackPool.slice(0, count).map((q, i) => ({ id: String(i + 1), ...q }));

const dedupeAndFill = (input: InterviewQuestion[] | undefined, count: number): InterviewQuestion[] => {
  const seen = new Set<string>();
  const unique: InterviewQuestion[] = [];

  for (const q of input ?? []) {
    const prompt = (q.prompt || "").trim();
    if (!prompt) continue;
    const key = prompt.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      id: q.id || String(unique.length + 1),
      category: q.category || "experience",
      prompt,
      expectedFocus: q.expectedFocus?.trim() || "Relevant skills and communication clarity."
    });
    if (unique.length === count) break;
  }

  if (unique.length < count) {
    for (const fallback of fallbackQuestions(count)) {
      const key = fallback.prompt.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({ ...fallback, id: String(unique.length + 1) });
      if (unique.length === count) break;
    }
  }

  return unique;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { jdText, resumeText, mode, difficulty } = req.body as {
    jdText: string;
    resumeText: string;
    mode: "quick" | "comprehensive";
    difficulty: "easy" | "medium" | "hard";
  };

  const count = mode === "comprehensive" ? 12 : 8;
  const fallback = { questions: fallbackQuestions(count) };
  const data = await safeJsonCompletion<{ questions: InterviewQuestion[] }>(
    "You generate role-specific interview questions. Return JSON only.",
    `Create exactly ${count} interview questions based on the job description and resume. Difficulty: ${difficulty}.
Return this JSON shape:
{ "questions": [{ "id": "1", "category": "technical|behavioral|situational|experience", "prompt": "...", "expectedFocus": "..." }] }
Job Description:
${jdText}
Resume:
${resumeText}`,
    fallback
  );

  const normalized = dedupeAndFill(data.questions || fallback.questions, count).map((q, i) => ({
    ...q,
    id: String(i + 1)
  }));
  return res.status(200).json({ questions: normalized });
}
