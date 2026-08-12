import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#fdfbf7] to-[#f6f1e8] px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#D4AF37]/25 bg-white/80 p-10 text-center shadow-lg backdrop-blur-sm">
        <p className="mb-2 font-serif text-5xl text-[#4F5D2A]">404</p>
        <h1 className="mb-4 text-xl font-semibold text-[#5c5348]">Page Not Found</h1>
        <p className="mb-8 leading-relaxed text-[#7A7266]">
          Sorry, the page you are looking for doesn&apos;t exist.
        </p>
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 rounded-full bg-[#6B7D3A] px-6 py-3 text-sm font-medium tracking-wide text-white shadow-md transition hover:bg-[#5a6a31] hover:shadow-lg"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}
