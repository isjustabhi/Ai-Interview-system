import { useMemo } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useInterviewStore } from "@/store/interviewStore";

const scoreColor = (score: number) => (score >= 75 ? "text-neon" : score >= 50 ? "text-cyan" : "text-red-300");

export default function FeedbackPage() {
  const router = useRouter();
  const { feedback, resetInterview } = useInterviewStore();

  const radar = useMemo(() => {
    if (!feedback) return [];
    return [
      { metric: "Technical", score: feedback.breakdown.technical },
      { metric: "Soft Skills", score: feedback.breakdown.softSkills },
      { metric: "Cultural Fit", score: feedback.breakdown.culturalFit },
      { metric: "Communication", score: feedback.breakdown.communication }
    ];
  }, [feedback]);

  if (!feedback) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="glass rounded-[20px] p-6">
          Feedback not available yet. Complete an interview first.
          <button className="ml-4 rounded-xl bg-cyan px-4 py-2 text-navy" onClick={() => router.push("/upload")}>
            Go to Setup
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-[22px] p-6 sm:p-8">
        <h1 className="text-3xl font-semibold">AI Feedback Dashboard</h1>
        <p className="mt-2 text-slate-300">Comprehensive interview evaluation aligned with your target role.</p>
        <p className={`mt-4 text-5xl font-bold ${scoreColor(feedback.overallMatch)}`}>{feedback.overallMatch}% Match</p>
      </motion.section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-[20px] p-5">
          <h2 className="text-xl font-medium">Score Breakdown</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="#94a3b833" />
                <PolarAngleAxis dataKey="metric" stroke="#cbd5e1" />
                <Radar dataKey="score" stroke="#00D9FF" fill="#00D9FF66" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-[20px] p-5">
          <h2 className="text-xl font-medium">Recommendations</h2>
          <ul className="mt-4 space-y-2 text-slate-200">
            {feedback.recommendations.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-[20px] p-5">
          <h2 className="text-xl font-medium text-neon">Strengths</h2>
          <ul className="mt-3 space-y-2">{feedback.strengths.map((item) => <li key={item}>- {item}</li>)}</ul>
        </div>
        <div className="glass rounded-[20px] p-5">
          <h2 className="text-xl font-medium text-red-200">Areas to Improve</h2>
          <ul className="mt-3 space-y-2">{feedback.improvements.map((item) => <li key={item}>- {item}</li>)}</ul>
        </div>
      </section>

      <section className="mt-6 glass rounded-[20px] p-5">
        <h2 className="text-xl font-medium">Question-by-Question Feedback</h2>
        <div className="mt-4 space-y-3">
          {feedback.perQuestion.map((row) => (
            <article key={row.questionId} className="rounded-xl border border-lavender/30 bg-midnight/40 p-4">
              <p className="text-sm text-lavender">Question {row.questionId}</p>
              <p className="mt-1 text-sm text-slate-300">Score: {row.score}/100</p>
              <p className="mt-2">{row.feedback}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-xl bg-cyan px-4 py-2 font-medium text-navy" onClick={() => window.print()}>
          Download Report (Print/PDF)
        </button>
        <button
          className="rounded-xl border border-lavender/40 px-4 py-2"
          onClick={() => {
            resetInterview();
            router.push("/upload");
          }}
        >
          Restart Interview
        </button>
      </div>
    </main>
  );
}