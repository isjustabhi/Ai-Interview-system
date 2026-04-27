import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useInterviewStore } from "@/store/interviewStore";

type ParseResponse = { text: string };

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

async function parseFile(file: File): Promise<string> {
  const dataUrl = await toDataUrl(file);
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, dataUrl, mimeType: file.type })
  });
  if (!res.ok) throw new Error("Unable to parse file");
  const payload = (await res.json()) as ParseResponse;
  return payload.text;
}

export default function UploadPage() {
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdPastedText, setJdPastedText] = useState("");
  const [resumePastedText, setResumePastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"quick" | "comprehensive">("quick");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const router = useRouter();
  const { setDocuments, setSetup } = useInterviewStore();

  const onDropJd = useCallback((files: File[]) => setJdFile(files[0] ?? null), []);
  const onDropResume = useCallback((files: File[]) => setResumeFile(files[0] ?? null), []);
  const acceptedFiles = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"]
  };

  const jdDropzone = useDropzone({
    onDrop: onDropJd,
    multiple: false,
    accept: acceptedFiles
  });

  const resumeDropzone = useDropzone({
    onDrop: onDropResume,
    multiple: false,
    accept: acceptedFiles
  });

  const canStart = useMemo(() => {
    const hasJd = Boolean(jdFile || jdPastedText.trim());
    const hasResume = Boolean(resumeFile || resumePastedText.trim());
    return hasJd && hasResume;
  }, [jdFile, resumeFile, jdPastedText, resumePastedText]);

  const startInterview = async () => {
    const hasJd = Boolean(jdFile || jdPastedText.trim());
    const hasResume = Boolean(resumeFile || resumePastedText.trim());
    if (!hasJd || !hasResume) return;
    setLoading(true);
    try {
      const [jdText, resumeText] = await Promise.all([
        jdFile ? parseFile(jdFile) : Promise.resolve(jdPastedText.trim()),
        resumeFile ? parseFile(resumeFile) : Promise.resolve(resumePastedText.trim())
      ]);
      setDocuments(jdText, resumeText);
      setSetup(mode, difficulty);
      toast.success("Documents analyzed. Generating interview...");
      await router.push("/interview");
    } catch {
      toast.error("Failed to parse files. Try another document format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">Interview Setup</h1>
      <p className="mt-2 text-slate-300">Upload your job description and resume to begin an AI-driven interview flow.</p>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <DropCard
          title="Job Description"
          file={jdFile}
          dropzone={jdDropzone}
          pastedText={jdPastedText}
          onPastedTextChange={setJdPastedText}
        />
        <DropCard
          title="Resume / CV"
          file={resumeFile}
          dropzone={resumeDropzone}
          pastedText={resumePastedText}
          onPastedTextChange={setResumePastedText}
        />
      </section>

      <section className="glass mt-8 rounded-[20px] p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">Interview Mode</span>
            <select
              className="rounded-xl border border-lavender/30 bg-midnight/60 px-4 py-3 focus-ring"
              value={mode}
              onChange={(e) => setMode(e.target.value as "quick" | "comprehensive")}
            >
              <option value="quick">Quick (8 questions)</option>
              <option value="comprehensive">Comprehensive (12 questions)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-300">Difficulty</span>
            <select
              className="rounded-xl border border-lavender/30 bg-midnight/60 px-4 py-3 focus-ring"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>

        <button
          onClick={startInterview}
          disabled={!canStart || loading}
          className="mt-6 rounded-2xl bg-cyan px-6 py-3 font-medium text-navy transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Start Interview"}
        </button>
      </section>
    </main>
  );
}

function DropCard({
  title,
  file,
  dropzone,
  pastedText,
  onPastedTextChange
}: {
  title: string;
  file: File | null;
  dropzone: ReturnType<typeof useDropzone>;
  pastedText: string;
  onPastedTextChange: (value: string) => void;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass rounded-[20px] p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      <div
        {...dropzone.getRootProps()}
        className="mt-4 cursor-pointer rounded-2xl border border-dashed border-cyan/40 bg-navy/40 p-8 text-center transition hover:border-cyan"
      >
        <input {...dropzone.getInputProps()} aria-label={`Upload ${title}`} />
        <p className="text-sm text-slate-300">Drag & drop or click to upload (.pdf, .docx, .txt)</p>
        <p className="mt-3 text-sm text-cyan">{file ? file.name : "No file selected"}</p>
      </div>
      <div className="mt-4">
        <label className="text-sm text-slate-300" htmlFor={`${title}-paste`}>
          Or paste text
        </label>
        <textarea
          id={`${title}-paste`}
          value={pastedText}
          onChange={(e) => onPastedTextChange(e.target.value)}
          placeholder={`Paste ${title.toLowerCase()} content here...`}
          className="mt-2 min-h-32 w-full rounded-2xl border border-lavender/30 bg-midnight/50 p-3 focus-ring"
        />
      </div>
    </motion.div>
  );
}