import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useInterviewStore } from "@/store/interviewStore";
import { InterviewQuestion } from "@/types/interview";

type QuestionResponse = { questions: InterviewQuestion[] };
type StarGuide = {
  situation: string;
  task: string;
  action: string;
  result: string;
  starterAnswer: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechWindow = Window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  SpeechRecognition?: new () => SpeechRecognitionLike;
};

export default function InterviewPage() {
  const router = useRouter();
  const { jdText, resumeText, mode, difficulty, questions, answers, setQuestions, saveAnswer, setFeedback } = useInterviewStore();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [starGuide, setStarGuide] = useState<StarGuide | null>(null);
  const [loadingStarGuide, setLoadingStarGuide] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechWindow;
    setVoiceSupported(Boolean(speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition));
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!jdText || !resumeText) {
      router.replace("/upload");
      return;
    }
    if (questions.length > 0) return;
    setLoadingQuestions(true);
    fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdText, resumeText, mode, difficulty })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return (await res.json()) as QuestionResponse;
      })
      .then((payload) => setQuestions(payload.questions))
      .catch(() => toast.error("Could not generate questions. Please retry."))
      .finally(() => setLoadingQuestions(false));
  }, [jdText, resumeText, mode, difficulty, questions.length, router, setQuestions]);

  const current = questions[index];
  const answeredCount = answers.filter((a) => !a.skipped && a.answer.trim().length > 0).length;
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!current) return;
    const existing = answers.find((a) => a.questionId === current.id);
    setValue(existing?.answer ?? "");
    setStarGuide(null);
  }, [current, answers]);

  const canSubmitAll = useMemo(() => questions.length > 0 && index === questions.length - 1, [questions.length, index]);

  const goNext = (skip = false) => {
    if (!current) return;
    saveAnswer(current.id, value, skip || value.trim().length === 0);
    setIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const finish = async () => {
    if (!current) return;
    saveAnswer(current.id, value, value.trim().length === 0);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText,
          resumeText,
          questions,
          answers: useInterviewStore.getState().answers
        })
      });
      if (!res.ok) throw new Error("feedback failed");
      const payload = await res.json();
      setFeedback(payload.feedback);
      router.push("/feedback");
    } catch {
      toast.error("Feedback generation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechWindow;
    const SpeechRecognitionCtor = speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? "";
      }
      setValue(transcript.trim());
    };

    recognition.onerror = () => {
      toast.error("Could not capture audio. Check microphone permission.");
      setIsListening(false);
      recognition.stop();
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const stopVoiceInput = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  };

  const readQuestionAloud = () => {
    if (typeof window === "undefined" || !current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${current.prompt}. Focus area: ${current.expectedFocus}`);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const generateStarGuide = async () => {
    if (!current) return;
    setLoadingStarGuide(true);
    try {
      const res = await fetch("/api/star-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText,
          resumeText,
          question: current
        })
      });
      if (!res.ok) throw new Error("star help failed");
      const payload = (await res.json()) as { guide: StarGuide };
      setStarGuide(payload.guide);
      toast.success("STAR starter generated.");
    } catch {
      toast.error("Could not generate STAR starter.");
    } finally {
      setLoadingStarGuide(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <header className="glass rounded-[20px] p-5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Interactive Interview</h1>
          <p className="text-sm text-slate-300">
            {index + 1} / {Math.max(questions.length, 1)} questions
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan to-purple"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </header>

      {loadingQuestions ? (
        <div className="glass mt-6 rounded-[20px] p-8">Generating personalized questions...</div>
      ) : current ? (
        <AnimatePresence mode="wait">
          <motion.section
            key={current.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="glass mt-6 rounded-[20px] p-6"
          >
            <p className="text-sm uppercase tracking-widest text-lavender">{current.category}</p>
            <h2 className="mt-2 text-xl leading-relaxed">{current.prompt}</h2>
            <p className="mt-3 text-sm text-slate-300">Focus: {current.expectedFocus}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {voiceSupported ? (
                <>
                  {!isListening ? (
                    <button
                      type="button"
                      onClick={startVoiceInput}
                      className="rounded-xl border border-cyan/40 px-4 py-2 text-cyan hover:bg-cyan/10"
                    >
                      Start Voice Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceInput}
                      className="rounded-xl border border-red-300/50 px-4 py-2 text-red-200 hover:bg-red-400/10"
                    >
                      Stop Voice Answer
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">Voice input is unavailable in this browser.</p>
              )}
              <button
                type="button"
                onClick={readQuestionAloud}
                className="rounded-xl border border-lavender/40 px-4 py-2 text-lavender hover:bg-lavender/10"
              >
                Read Question Aloud
              </button>
            </div>
            <label className="mt-6 block">
              <span className="sr-only">Answer</span>
              <textarea
                className="min-h-44 w-full rounded-2xl border border-lavender/30 bg-midnight/50 p-4 focus-ring"
                placeholder="Type your answer..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <div className="mt-2 text-right text-xs text-slate-400">{value.length} characters</div>
            <div className="mt-3">
              <button
                type="button"
                onClick={generateStarGuide}
                disabled={loadingStarGuide}
                className="rounded-xl border border-cyan/40 px-4 py-2 text-cyan hover:bg-cyan/10 disabled:opacity-50"
              >
                {loadingStarGuide ? "Generating STAR Help..." : "Need help? Generate STAR Starter"}
              </button>
            </div>

            {starGuide ? (
              <article className="mt-4 rounded-2xl border border-lavender/30 bg-midnight/40 p-4">
                <p className="text-sm font-medium text-lavender">STAR Guidance</p>
                <p className="mt-2 text-sm">
                  <span className="text-cyan">Situation:</span> {starGuide.situation}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-cyan">Task:</span> {starGuide.task}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-cyan">Action:</span> {starGuide.action}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-cyan">Result:</span> {starGuide.result}
                </p>
                <div className="mt-3 rounded-xl bg-navy/50 p-3 text-sm text-slate-200">{starGuide.starterAnswer}</div>
                <button
                  type="button"
                  onClick={() => setValue(starGuide.starterAnswer)}
                  className="mt-3 rounded-xl bg-lavender/90 px-3 py-2 text-sm font-medium text-navy hover:bg-lavender"
                >
                  Use This Starter
                </button>
              </article>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {!canSubmitAll ? (
                <>
                  <button className="rounded-xl border border-lavender/40 px-4 py-2 hover:bg-lavender/10" onClick={() => goNext(true)}>
                    Skip
                  </button>
                  <button className="rounded-xl bg-cyan px-4 py-2 font-medium text-navy" onClick={() => goNext(false)}>
                    Save & Next
                  </button>
                </>
              ) : (
                <button
                  className="rounded-xl bg-neon px-4 py-2 font-semibold text-navy disabled:opacity-50"
                  disabled={submitting}
                  onClick={finish}
                >
                  {submitting ? "Evaluating..." : "Generate Feedback"}
                </button>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      ) : (
        <div className="glass mt-6 rounded-[20px] p-6">No questions yet.</div>
      )}

      <p className="mt-4 text-sm text-slate-300">Answered: {answeredCount} / {questions.length}</p>
    </main>
  );
}