import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-[24px] p-8 sm:p-12"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-cyan/85">AI Interview & Feedback System</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
            Your <span className="gradient-text">futuristic</span> mock interview copilot.
          </h1>
          <p className="mt-6 max-w-2xl text-slate-300">
            Upload a job description and resume. Get targeted interview questions, answer in a guided flow, and receive
            deep AI feedback with score breakdown and practical recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              className="rounded-2xl bg-cyan px-6 py-3 font-medium text-navy transition hover:scale-[1.02] hover:shadow-glass focus-ring"
              href="/upload"
            >
              Start Interview
            </Link>
            <a
              className="rounded-2xl border border-lavender/40 px-6 py-3 text-lavender transition hover:bg-lavender/10 focus-ring"
              href="#features"
            >
              Explore Features
            </a>
          </div>
        </motion.section>

        <section id="features" className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            "Smart document parsing for JD + Resume",
            "Context-aware technical and behavioral questions",
            "Rich AI scoring dashboard with strengths and gaps"
          ].map((feature, i) => (
            <motion.article
              key={feature}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.45 }}
              className="glass rounded-[20px] p-5 text-slate-200"
            >
              {feature}
            </motion.article>
          ))}
        </section>
      </div>
    </main>
  );
}