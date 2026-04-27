# AI Interview & Feedback System

Futuristic Next.js web app for AI-powered mock interviews:
- Upload Job Description + Resume (`.pdf`, `.docx`, `.txt`)
- Generate contextual interview questions (8-12)
- Submit answers with skip tracking and progress
- Get comprehensive feedback with score breakdown + recommendations

## Tech Stack
- Next.js + React + TypeScript
- Tailwind CSS + Framer Motion
- Zustand state management
- OpenAI API integration with graceful fallback mode
- Recharts for analytics visualization

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
3. Add your key to `.env.local`:
   ```env
   OPENAI_API_KEY=your_key_here
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Notes
- If `OPENAI_API_KEY` is missing, the app still works with deterministic fallback question/feedback generation.
- Export is supported through print-to-PDF on the feedback page.