import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
      <div className="glass rounded-[20px] p-8 text-center">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="mt-2 text-slate-300">Page not found.</p>
        <Link href="/" className="mt-5 inline-block rounded-xl bg-cyan px-4 py-2 font-medium text-navy">
          Return Home
        </Link>
      </div>
    </main>
  );
}