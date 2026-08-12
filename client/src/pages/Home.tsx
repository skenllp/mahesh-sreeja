import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/* ═══════════════════════════════════════════════════
   ALL IMAGES that need to be loaded before reveal
═══════════════════════════════════════════════════ */
const PRELOAD_IMAGES = [
  "/gbmain.jpg", "/groom.jpg", "/bride.jpg", "/bride2.jpg",
  "/ringexchange.jpg", "/gb.jpg", "/gb2.jpg",
];

/* ═══════════════════════════════════════════════════
   PHOTO LOADER – elegant spinner until images ready
═══════════════════════════════════════════════════ */
function PhotoLoader({ onComplete }: { onComplete: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const total = PRELOAD_IMAGES.length;
  const countRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    // Hard fallback — show site after 5s regardless
    const fallback = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onComplete(); }
    }, 5000);

    countRef.current = 0;
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        countRef.current += 1;
        setLoaded(countRef.current);
        if (countRef.current >= total && !doneRef.current) {
          doneRef.current = true;
          clearTimeout(fallback);
          setTimeout(onComplete, 500);
        }
      };
      img.onload = done;
      img.onerror = done;
    });

    return () => clearTimeout(fallback);
  }, [onComplete]);

  const pct = Math.round((loaded / total) * 100);
  const circumference = 2 * Math.PI * 36;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg,#fffdf9 0%,#f7f1e8 60%,#ede8df 100%)" }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* Falling petals behind loader */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{ left: `${i * 10 + 3}%`, width: 10, height: 10 }}
          initial={{ y: -10, opacity: 0.7, rotate: 0 }}
          animate={{ y: "105vh", opacity: [0.7, 0.5, 0], rotate: 360 }}
          transition={{ duration: 5 + i * 0.5, delay: i * 0.3, ease: "linear", repeat: Infinity }}
        >
          <svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="6" ry="11" fill="#D4AF37" fillOpacity="0.45" transform="rotate(30 12 12)" /></svg>
        </motion.div>
      ))}

      <motion.div
        className="text-5xl mb-8"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        💍
      </motion.div>

      {/* Circular progress ring */}
      <div className="relative w-24 h-24 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f0e8d8" strokeWidth="5" />
          <motion.circle
            cx="40" cy="40" r="36" fill="none"
            stroke="#D4AF37" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-[#4F5D2A]">{pct}%</span>
        </div>
      </div>

      <p className="font-serif text-2xl text-[#4F5D2A] mb-2">Mahesh &amp; Sreeja</p>
      <p className="text-xs tracking-[0.3em] uppercase text-[#b89a63]">Loading your invitation…</p>

      {/* Bar */}
      <div className="mt-6 w-48 h-1 rounded-full bg-[#e8ddc8] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f5e6b0]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   RIPPLE – touch/click effect on any element
═══════════════════════════════════════════════════ */
function useRipple() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const trigger = useCallback((e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const id = Date.now();
    setRipples((r) => [...r, { x: clientX - rect.left, y: clientY - rect.top, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
  }, []);
  return { ripples, trigger };
}

/* ═══════════════════════════════════════════════════
   TILT CARD – 3D tilt on hover / touch
═══════════════════════════════════════════════════ */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 });

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 14);
    rotateX.set(-y * 14);
  };

  const handleLeave = () => { rotateX.set(0); rotateY.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchMove={handleMove}
      onTouchEnd={handleLeave}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FALLING PETAL
═══════════════════════════════════════════════════ */
function Petal({ delay }: { delay: number }) {
  const left = Math.random() * 100;
  const size = 8 + Math.random() * 14;
  const dur = 4 + Math.random() * 4;
  return (
    <motion.div className="absolute top-0 pointer-events-none"
      style={{ left: `${left}%`, width: size, height: size }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 }}
      transition={{ duration: dur, delay, ease: "linear", repeat: Infinity, repeatDelay: Math.random() * 6 }}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="6" ry="11" fill="#D4AF37" fillOpacity="0.55" transform="rotate(30 12 12)" />
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FLOATING HEART
═══════════════════════════════════════════════════ */
function FloatingHeart({ delay, x }: { delay: number; x: string }) {
  return (
    <motion.div className="absolute bottom-0 text-rose-400/40 text-2xl pointer-events-none select-none"
      style={{ left: x }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -300, opacity: [0, 0.7, 0] }}
      transition={{ duration: 6, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 3 }}
    >♥</motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FADE SECTION
═══════════════════════════════════════════════════ */
function FadeSection({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div className={className} style={style}
      initial={{ opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   GOLD ORNAMENT DIVIDER
═══════════════════════════════════════════════════ */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z" fill="#D4AF37" fillOpacity="0.7" />
      </svg>
      <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GALLERY CELL – bento grid tile
═══════════════════════════════════════════════════ */
function GalleryCell({ src, label, objectPosition = "center" }: { src: string; label: string; objectPosition?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ripples, trigger } = useRipple();

  return (
    <motion.div ref={ref}
      className="relative w-full h-full overflow-hidden rounded-2xl shadow-xl group cursor-pointer"
      whileHover={{ scale: 1.02, boxShadow: "0 25px 60px rgba(107,125,58,0.25)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35 }}
      onClick={(e) => trigger(e, ref.current!)}
      onTouchStart={(e) => trigger(e, ref.current!)}
    >
      <motion.img src={src} alt={label}
        className="w-full h-full object-cover"
        style={{ objectPosition }}
        whileHover={{ scale: 1.07 }}
        transition={{ duration: 0.5 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {label}
      </div>
      {/* Ripple effects */}
      {ripples.map((r) => (
        <motion.span key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{ left: r.x - 40, top: r.y - 40, width: 80, height: 80 }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION TITLE with animated underline
═══════════════════════════════════════════════════ */
function SectionTitle({ children, accent = "gold" }: { children: React.ReactNode; accent?: "gold" | "ceremony" | "reception" }) {
  const underline = accent === "ceremony"
    ? "linear-gradient(90deg, transparent, #6B7D3A, #D4AF37, transparent)"
    : accent === "reception"
      ? "linear-gradient(90deg, transparent, #c4717a, #D4AF37, #e8b4b8, transparent)"
      : "linear-gradient(90deg, transparent, #D4AF37, transparent)";
  return (
    <div className="text-center mb-2">
      <motion.h2
        className="text-4xl md:text-5xl font-serif text-[#4F5D2A] inline-block cursor-default"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >{children}</motion.h2>
      <motion.div className="h-0.5 mx-auto mt-3 rounded-full"
        style={{ background: underline }}
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: 140, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EVENT CARD with theme + ripple
═══════════════════════════════════════════════════ */
type EventTheme = "ceremony" | "reception";
const eventThemes: Record<EventTheme, { hoverBg: string; hoverBorder: string; hoverShadow: string; shimmer: string }> = {
  ceremony: {
    hoverBg: "linear-gradient(135deg,rgba(107,125,58,0.14) 0%,rgba(212,175,55,0.2) 50%,rgba(255,253,249,0.9) 100%)",
    hoverBorder: "rgba(107,125,58,0.6)",
    hoverShadow: "0 28px 60px rgba(107,125,58,0.22)",
    shimmer: "rgba(212,175,55,0.35)",
  },
  reception: {
    hoverBg: "linear-gradient(135deg,rgba(196,113,122,0.14) 0%,rgba(212,175,55,0.22) 45%,rgba(255,248,245,0.95) 100%)",
    hoverBorder: "rgba(196,113,122,0.55)",
    hoverShadow: "0 28px 60px rgba(196,113,122,0.22)",
    shimmer: "rgba(232,180,184,0.45)",
  },
};

function EventCard({ icon, title, body, theme, index }: { icon: string; title: string; body: string; theme: EventTheme; index: number }) {
  const t = eventThemes[theme];
  const ref = useRef<HTMLDivElement>(null);
  const { ripples, trigger } = useRipple();

  return (
    <motion.div
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <motion.div ref={ref}
        className="group relative h-full overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-white/70 p-8 text-center shadow-md backdrop-blur-sm cursor-pointer"
        whileHover={{ y: -10, scale: 1.03, borderColor: t.hoverBorder, boxShadow: t.hoverShadow }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        onClick={(e) => trigger(e, ref.current!)}
        onTouchStart={(e) => trigger(e, ref.current!)}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: t.hoverBg }} />
        <motion.span className="relative z-10 mb-3 inline-block text-4xl"
          whileHover={{ scale: 1.2, rotate: [-6, 6, 0] }}
          whileTap={{ scale: 1.3 }}
          transition={{ duration: 0.4 }}
        >{icon}</motion.span>
        <h3 className="relative z-10 mb-2 font-serif text-2xl text-[#4F5D2A]">{title}</h3>
        <p className="relative z-10 text-sm leading-relaxed text-[#7A7266]">{body}</p>
        <div className="absolute bottom-0 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full opacity-0 transition-all duration-300 group-hover:w-[45%] group-hover:opacity-100" style={{ background: t.hoverBorder }} />
        {ripples.map((r) => (
          <motion.span key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x - 40, top: r.y - 40, width: 80, height: 80 }}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   AMBIENT GLOW BLOB
═══════════════════════════════════════════════════ */
function AmbientGlow({ colors }: { colors: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      style={{ background: colors }}
      animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   COUNT BOX
═══════════════════════════════════════════════════ */
function CountBox({ value, label }: { value: string | number; label: string }) {
  return (
    <motion.div className="group flex flex-col items-center"
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#D4AF37]/30 shadow-md flex items-center justify-center transition-all duration-300 group-hover:border-[#D4AF37]/60 group-hover:shadow-[0_0_24px_rgba(212,175,55,0.35)]">
        <span className="text-3xl md:text-4xl font-serif text-[#4F5D2A] tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs tracking-widest uppercase text-[#7A7266]">{label}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MUSIC BUTTON
═══════════════════════════════════════════════════ */
function MusicButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <motion.button onClick={onToggle}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-[#D4AF37]/40 shadow-lg flex items-center justify-center text-[#4F5D2A] active:scale-90 transition-transform"
      whileHover={{ scale: 1.15, boxShadow: "0 0 20px rgba(212,175,55,0.4)" }}
      whileTap={{ scale: 0.88 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, type: "spring" }}
      aria-label={muted ? "Unmute music" : "Mute music"}
    >
      {muted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION ARROW – mobile scroll guide (hidden on desktop)
═══════════════════════════════════════════════════ */
function SectionArrow({ nextId }: { nextId: string }) {
  const scrollToNext = () => {
    const el = document.getElementById(nextId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="flex justify-center pt-8 pb-2 md:hidden">
      <motion.button
        onClick={scrollToNext}
        aria-label="Scroll to next section"
        className="flex flex-col items-center gap-1 text-[#b89a63] active:scale-90"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.85 }}
      >
        {/* double chevron for emphasis */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="-mt-4 opacity-50">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>
    </div>
  );
}
export default function Home() {
  const [imagesReady, setImagesReady] = useState(false);
  const [phase, setPhase] = useState<"typing" | "hold" | "done">("typing");
  const [displayedText, setDisplayedText] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, arrived: false });
  const [muted, setMuted] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  // burst particles from button click
  const [burst, setBurst] = useState<{ id: number; x: number; y: number }[]>([]);
  // flag to trigger invitation section entrance animation
  const [invitationHighlight, setInvitationHighlight] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const invitationRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleImagesLoaded = useCallback(() => setImagesReady(true), []);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  /* Typing splash */
  useEffect(() => {
    const text = "Our Journey of Love Begins Here";
    let i = 0;
    const type = () => {
      if (i <= text.length) { setDisplayedText(text.slice(0, i)); i++; setTimeout(type, 75); }
      else { setPhase("hold"); setTimeout(() => setPhase("done"), 1400); }
    };
    setTimeout(type, 400);
  }, []);

  /* ── MUSIC ──────────────────────────────────────
     Android/iOS autoplay rules:
     • Muted autoplay is allowed on ALL browsers
     • Unmuted autoplay needs a prior user gesture
     Flow:
       1. <audio autoPlay muted> starts silently immediately
       2. First user tap anywhere → unmute + resume
       3. If already playing unmuted (desktop) → no banner shown
  ────────────────────────────────────────────── */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.35;

    // Try unmuted first (works on desktop / some Android)
    el.muted = false;
    el.play()
      .then(() => setNeedsGesture(false))
      .catch(() => {
        // Fallback: muted play — always succeeds
        el.muted = true;
        el.play().catch(() => {});
        setNeedsGesture(true);
      });
  }, []);

  // Once user touches/clicks anywhere → unmute
  useEffect(() => {
    if (!needsGesture) return;
    const unlock = () => {
      const el = audioRef.current;
      if (!el) return;
      el.muted = false;
      if (el.paused) el.play().catch(() => {});
      setNeedsGesture(false);
    };
    // passive touch is picked up on first tap of the loader/splash
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    document.addEventListener("click", unlock, { once: true });
    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, [needsGesture]);

  // Keep mute button in sync
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (!muted && el.paused) el.play().catch(() => {});
  }, [muted]);

  /* Countdown */
  useEffect(() => {
    const target = new Date("September 6, 2026 12:00:00").getTime();
    const tick = () => {
      const dist = target - Date.now();
      if (dist <= 0) setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, arrived: true });
      else setCountdown({
        days: Math.floor(dist / 86400000),
        hours: Math.floor((dist % 86400000) / 3600000),
        minutes: Math.floor((dist % 3600000) / 60000),
        seconds: Math.floor((dist % 60000) / 1000),
        arrived: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* View Invitation click — burst + scroll + highlight */
  const handleViewInvitation = useCallback(() => {
    // 1. Spawn burst particles from button position
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const id = Date.now();
      setBurst([{ id, x: cx, y: cy }]);
      setTimeout(() => setBurst([]), 1200);
    }
    // 2. Smooth scroll to invitation section
    setTimeout(() => {
      invitationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    // 3. Trigger highlight glow on the section
    setTimeout(() => {
      setInvitationHighlight(true);
      setTimeout(() => setInvitationHighlight(false), 2500);
    }, 700);
  }, []);

  const petals = Array.from({ length: 18 }, (_, i) => i);
  const hearts = ["8%", "20%", "35%", "52%", "68%", "82%", "93%"];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(180deg,#fdfbf7 0%,#f8f3eb 100%)" }}>

      <audio ref={audioRef} src="/audio/wedsong.mp3" loop preload="auto" playsInline autoPlay muted />

      {/* ── PHOTO LOADER ── */}
      <AnimatePresence mode="wait">
        {!imagesReady && <PhotoLoader key="loader" onComplete={handleImagesLoaded} />}
      </AnimatePresence>

      {/* ── OPENING SPLASH (shown after images ready) ── */}
      <AnimatePresence>
        {imagesReady && phase !== "done" && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden cursor-pointer"
            style={{ background: "linear-gradient(135deg,#fffdf9 0%,#f7f1e8 50%,#ede8df 100%)" }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            {petals.map((i) => <Petal key={i} delay={i * 0.3} />)}
            {hearts.map((x, i) => <FloatingHeart key={i} delay={i * 0.8} x={x} />)}
            <div className="text-center px-6 relative z-10">
              <motion.div className="text-5xl mb-6"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
              >💍</motion.div>
              <h1 className="text-3xl md:text-5xl font-serif text-[#4F5D2A] min-h-[60px] leading-tight">
                {displayedText}
                <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}
                  className="inline-block w-0.5 h-8 md:h-10 bg-[#6B7D3A] ml-1 align-middle"
                />
              </h1>
              <motion.p className="mt-4 text-sm tracking-[0.3em] uppercase text-[#7A7266]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: phase === "hold" ? 1 : 0, y: phase === "hold" ? 0 : 12 }}
                transition={{ duration: 0.6 }}
              >Wedding Invitation · Mahesh &amp; Sreeja</motion.p>
              {needsGesture && (
                <motion.div
                  className="mt-6 flex items-center gap-2 justify-center text-xs tracking-widest uppercase text-[#b89a63]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span>🎵</span><span>Tap to start music</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: imagesReady && phase === "done" ? 1 : 0 }} transition={{ duration: 1 }}>

        {/* ═══════════ HERO ═══════════ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <motion.div className="absolute inset-0 w-full h-[120%] -top-[10%]" style={{ y: heroBgY }}>
            <img src="/gbmain.jpg" alt="Mahesh & Sreeja"
              className="w-full h-full object-cover object-left md:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#fdfbf7]" />
          </motion.div>

          <motion.div className="relative z-10 text-center px-6 py-32" style={{ opacity: heroOpacity }}>
            <motion.p className="text-sm tracking-[0.4em] uppercase text-white/80 mb-6 font-light"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }}
            >We are getting Married</motion.p>

            <motion.h1 className="text-5xl md:text-9xl font-serif leading-none mb-6"
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-white drop-shadow-2xl">Mahesh</span>
              <span className="text-[#D4AF37] mx-3 md:mx-5 drop-shadow-2xl">&amp;</span>
              <span className="text-white drop-shadow-2xl">Sreeja</span>
            </motion.h1>

            <motion.p className="text-xl md:text-2xl text-white/90 font-light tracking-widest mb-10"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
            >Sunday · 6 September 2026</motion.p>

            {/* ── VIEW INVITATION BUTTON – burst + scroll + highlight ── */}
            <motion.button
              ref={buttonRef}
              onClick={handleViewInvitation}
              className="relative inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-[#D4AF37] text-white font-medium text-sm tracking-[0.2em] uppercase shadow-xl overflow-hidden group"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6 }}
              whileHover={{ scale: 1.08, boxShadow: "0 0 40px rgba(212,175,55,0.7), 0 20px 50px rgba(212,175,55,0.4)" }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Continuous shimmer sweep */}
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
              />
              {/* Expanding pulse rings */}
              {[0, 0.5, 1].map((delay) => (
                <motion.span key={delay}
                  className="absolute inset-0 rounded-full border border-white/30"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 2, delay, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
              <span className="relative z-10">View Invitation</span>
              <motion.span className="relative z-10 text-lg"
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >💍</motion.span>
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          >
            <motion.div className="w-px h-12 bg-white/50"
              animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-white/60 text-xs tracking-widest uppercase">Scroll</span>
          </motion.div>
        </section>

        {/* ═══════════ COUNTDOWN ═══════════ */}
        <section id="countdown" className="py-20 px-4 bg-gradient-to-b from-[#fdfbf7] to-[#f6f1e8]">
          <FadeSection className="max-w-3xl mx-auto text-center">
            <p className="text-sm tracking-[0.3em] uppercase text-[#7A7266] mb-8">
              {countdown.arrived ? "The wedding day has arrived 💍" : "Counting down to forever"}
            </p>
            {!countdown.arrived && (
              <div className="flex items-start justify-center gap-4 md:gap-8">
                <CountBox value={countdown.days} label="Days" />
                <span className="text-3xl text-[#D4AF37] mt-4">:</span>
                <CountBox value={countdown.hours} label="Hours" />
                <span className="text-3xl text-[#D4AF37] mt-4">:</span>
                <CountBox value={countdown.minutes} label="Mins" />
                <span className="text-3xl text-[#D4AF37] mt-4">:</span>
                <CountBox value={countdown.seconds} label="Secs" />
              </div>
            )}
          </FadeSection>
          <SectionArrow nextId="invitation" />
        </section>

        {/* ═══════════ INVITATION VERSE ═══════════ */}
        <section ref={invitationRef} id="invitation" className="py-24 px-4 relative overflow-hidden">
          {/* animated glow highlight when scrolled to */}
          <AnimatePresence>
            {invitationHighlight && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* expanding gold ring from centre */}
                {[0, 0.15, 0.3].map((delay) => (
                  <motion.div key={delay}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#D4AF37]/60"
                    initial={{ width: 0, height: 0, opacity: 0.9 }}
                    animate={{ width: "140vw", height: "140vw", opacity: 0 }}
                    transition={{ duration: 1.2, delay, ease: "easeOut" }}
                  />
                ))}
                {/* warm glow background */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.18) 0%, transparent 70%)" }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, #6B7D3A 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <FadeSection className="max-w-3xl mx-auto relative z-10">
            <motion.h2
              className="text-4xl md:text-5xl font-serif text-center text-[#4F5D2A] mb-2"
              animate={invitationHighlight ? { scale: [1, 1.06, 1], color: ["#4F5D2A", "#b89a30", "#4F5D2A"] } : {}}
              transition={{ duration: 0.7 }}
            >Invitation</motion.h2>
            <Ornament />
            <motion.div className="mt-10 relative" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="absolute -top-6 -left-4 text-8xl text-[#D4AF37]/20 font-serif leading-none select-none">"</div>
              <TiltCard>
                <motion.div
                  className="bg-white/70 backdrop-blur-sm border border-[#D4AF37]/20 rounded-3xl p-10 md:p-16 text-center shadow-lg relative z-10 group cursor-default"
                  animate={invitationHighlight
                    ? { scale: [0.96, 1.03, 1], boxShadow: ["0 0 0px transparent", "0 0 60px rgba(212,175,55,0.5)", "0 20px 50px rgba(107,125,58,0.15)"], borderColor: ["rgba(212,175,55,0.2)", "rgba(212,175,55,0.7)", "rgba(212,175,55,0.3)"] }
                    : {}
                  }
                  whileHover={{ boxShadow: "0 30px 70px rgba(107,125,58,0.18)", borderColor: "rgba(212,175,55,0.45)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <p className="text-lg md:text-xl text-[#4F5D2A] font-serif leading-relaxed mb-6 italic">
                    With hearts entwined in love and souls bound by destiny, we invite you to witness the beginning of our forever and seek the blessings of the Almighty.
                  </p>
                  <Ornament />
                  <p className="text-[#7A7266] text-sm tracking-widest uppercase mt-4">
                    The families of Mahesh &amp; Sreeja joyfully request your gracious presence
                  </p>
                </motion.div>
              </TiltCard>
              <div className="absolute -bottom-6 -right-4 text-8xl text-[#D4AF37]/20 font-serif leading-none select-none rotate-180">"</div>
            </motion.div>
          </FadeSection>
          <SectionArrow nextId="couple" />
        </section>

        {/* ═══════════ THE COUPLE ═══════════ */}
        <section id="couple" className="py-24 px-4 bg-gradient-to-b from-[#f6f1e8] to-[#fdfbf7]">
          <FadeSection>
            <h2 className="text-4xl md:text-5xl font-serif text-center text-[#4F5D2A] mb-2">The Couple</h2>
            <Ornament />
          </FadeSection>
          <div className="max-w-5xl mx-auto mt-14 grid md:grid-cols-2 gap-10">
            {[
              { src: "/groom.jpg", role: "Groom", name: "Mahesh", parents: "S/o Mrs. Koragappan & Late Mrs. Sarojini · Swarga House, Kasaragod" },
              { src: "/bride.jpg", role: "Bride", name: "Sreeja", parents: "D/o Mr. Raju & Mrs. Shantha · Puthiyara, Kozhikode" },
            ].map((person) => (
              <FadeSection key={person.role}>
                <motion.div
                  className="group relative overflow-hidden rounded-3xl shadow-2xl"
                  whileHover={{ y: -10, boxShadow: "0 40px 80px rgba(0,0,0,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <motion.img src={person.src} alt={person.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.07 }} transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="text-xs tracking-[0.3em] uppercase text-[#D4AF37] mb-1">{person.role}</div>
                    <h3 className="text-4xl font-serif mb-1">{person.name}</h3>
                    <p className="text-white/70 text-sm">{person.parents}</p>
                  </div>
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100" transition={{ duration: 0.4 }} />
                </motion.div>
              </FadeSection>
            ))}
          </div>
          <SectionArrow nextId="ringexchange" />
        </section>

        {/* ═══════════ RING EXCHANGE ═══════════ */}
        <section id="ringexchange" className="relative py-0 overflow-hidden">
          <div className="relative h-[70vh] md:h-[80vh]">
            <motion.img src="/ringexchange.jpg" alt="Ring Exchange"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.04 }} transition={{ duration: 5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <FadeSection className="absolute inset-0 flex items-center px-10 md:px-20">
              <div className="max-w-lg">
                <motion.div className="text-[#D4AF37] text-5xl mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >💍</motion.div>
                <h2 className="text-5xl md:text-6xl font-serif text-white mb-4 leading-tight">The Ring Exchange</h2>
                <p className="text-white/75 text-lg leading-relaxed">
                  The moment two souls promise each other a lifetime — sealed with a ring, blessed by the Almighty.
                </p>
                <Ornament />
                <p className="text-[#D4AF37] text-sm tracking-widest uppercase">6 September 2026</p>
              </div>
            </FadeSection>
          </div>
          <SectionArrow nextId="events" />
        </section>

        {/* ═══════════ WEDDING CEREMONY ═══════════ */}
        <section id="events" className="relative overflow-hidden py-24 px-4 bg-gradient-to-b from-[#f6f1e8] to-[#fdfbf7]">
          <AmbientGlow colors="radial-gradient(circle, rgba(107,125,58,0.18) 0%, transparent 70%)" />
          <FadeSection className="relative z-10">
            <SectionTitle accent="ceremony">Wedding Ceremony</SectionTitle>
            <Ornament />
          </FadeSection>
          <div className="relative z-10 mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { icon: "📅", title: "Date", body: "6 September 2026 · Sunday" },
              { icon: "✨", title: "Muhurtham", body: "12:00 PM – 12:30 PM" },
            ].map((item, i) => (
              <EventCard key={item.title} {...item} theme="ceremony" index={i} />
            ))}
          </div>
          <SectionArrow nextId="reception" />
        </section>

        {/* ═══════════ RECEPTION ═══════════ */}
        <section id="reception" className="relative overflow-hidden py-24 px-4">
          <AmbientGlow colors="radial-gradient(circle, rgba(196,113,122,0.16) 0%, rgba(212,175,55,0.1) 40%, transparent 70%)" />
          <FadeSection className="relative z-10">
            <SectionTitle accent="reception">Reception</SectionTitle>
            <Ornament />
          </FadeSection>
          <div className="relative z-10 mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { icon: "📅", title: "Date", body: "8 September 2026 · Tuesday" },
              { icon: "🕛", title: "Time", body: "12:00 PM – 6:00 PM" },
              { icon: "🌻", title: "Venue", body: "Sunflower Auditorium, Kasaragod" },
            ].map((item, i) => (
              <EventCard key={item.title} {...item} theme="reception" index={i} />
            ))}
          </div>
          {/* Google Maps directions */}
          <FadeSection className="relative z-10 mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://share.google/l6urq59gGVbp6HMg3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[#D4AF37]/60 bg-white/70 backdrop-blur-sm text-[#4F5D2A] text-sm font-medium tracking-widest uppercase shadow-md hover:bg-[#D4AF37] hover:text-white transition-all duration-300"
            >
              <span>📍</span> Reception Venue Map
            </a>
            <a
              href="https://share.google/BjvN1cYLAvvqWjfC6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[#D4AF37]/60 bg-white/70 backdrop-blur-sm text-[#4F5D2A] text-sm font-medium tracking-widest uppercase shadow-md hover:bg-[#D4AF37] hover:text-white transition-all duration-300"
            >
              <span>🌻</span> Sunflower Auditorium
            </a>
          </FadeSection>
          <SectionArrow nextId="photos" />
        </section>

        {/* ═══════════ OUR MOMENTS ═══════════ */}
        <section id="photos" className="py-24 px-4 bg-gradient-to-b from-[#f6f1e8] to-[#fdfbf7]">
          <FadeSection>
            <h2 className="text-4xl md:text-5xl font-serif text-center text-[#4F5D2A] mb-2">Our Moments</h2>
            <Ornament />
            <p className="text-center text-[#7A7266] max-w-xl mx-auto mt-4">A glimpse of our beautiful journey together</p>
          </FadeSection>
          <div className="max-w-5xl mx-auto mt-14" style={{
            display: "grid", gap: "10px",
            gridTemplateColumns: "2fr 1fr 1fr",
            gridTemplateRows: "280px 280px 280px",
            gridTemplateAreas: `"main groom groom" "main bride bride" "ring gb gb"`,
          }}>
            <FadeSection style={{ gridArea: "main" }} className="h-full">
              <GalleryCell src="/gbmain.jpg" label="Together Forever" />
            </FadeSection>
            <FadeSection style={{ gridArea: "groom" }} className="h-full">
              <GalleryCell src="/groom.jpg" label="Mahesh" />
            </FadeSection>
            <FadeSection style={{ gridArea: "bride" }} className="h-full">
              <GalleryCell src="/bride2.jpg" label="Sreeja" />
            </FadeSection>
            <FadeSection style={{ gridArea: "ring" }} className="h-full">
              <GalleryCell src="/ringexchange.jpg" label="Ring Exchange" />
            </FadeSection>
            <FadeSection style={{ gridArea: "gb" }} className="h-full">
              <GalleryCell src="/gb2.jpg" label="Mahesh & Sreeja" />
            </FadeSection>
          </div>
          <SectionArrow nextId="finalbanner" />
        </section>

        {/* ═══════════ FINAL BANNER ═══════════ */}
        <section id="finalbanner" className="relative overflow-hidden">
          <div className="relative h-[60vh]">
            <motion.img src="/gb.jpg" alt="Mahesh & Sreeja"
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }} transition={{ duration: 6, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <FadeSection className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-6 text-center">
              <motion.p className="text-[#D4AF37] text-sm tracking-[0.35em] uppercase mb-3"
                animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              >Forever &amp; Always</motion.p>
              <h2 className="text-5xl md:text-7xl font-serif text-white drop-shadow-2xl">Mahesh &amp; Sreeja</h2>
              <p className="text-white/70 text-lg mt-3 tracking-wider">6 September 2026</p>
            </FadeSection>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="bg-[#fdfbf7] border-t border-[#D4AF37]/20 py-16 px-4 text-center">
          <motion.div className="text-4xl mb-4"
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >💍</motion.div>
          <p className="text-3xl font-serif text-[#4F5D2A] mb-3">We look forward to your gracious presence</p>
          <Ornament />
          <p className="text-[#7A7266] tracking-widest text-sm uppercase mt-4">
            Mahesh &amp; Sreeja · 6 September 2026
          </p>
        </footer>

      </motion.div>

      <MusicButton muted={muted || needsGesture} onToggle={() => {
        if (needsGesture) {
          // First tap unlocks audio
          const el = audioRef.current;
          if (el) { el.muted = false; el.play().catch(() => {}); }
          setNeedsGesture(false);
        } else {
          setMuted((m) => !m);
        }
      }} />

      {/* ── BURST PARTICLES – fired from button on click ── */}
      <AnimatePresence>
        {burst.map(({ id, x, y }) => (
          <div key={id} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
            {/* 20 particles radiating outward */}
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * 360;
              const dist = 80 + Math.random() * 160;
              const rad = (angle * Math.PI) / 180;
              const tx = Math.cos(rad) * dist;
              const ty = Math.sin(rad) * dist;
              const emojis = ["💍", "✿", "♥", "✨", "🌸", "⭐"];
              const emoji = emojis[i % emojis.length];
              const size = 14 + Math.floor(Math.random() * 14);
              return (
                <motion.div key={i}
                  className="absolute select-none"
                  style={{ left: x, top: y, fontSize: size }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
                  animate={{ x: tx, y: ty, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut" }}
                >{emoji}</motion.div>
              );
            })}
            {/* shockwave ring from button */}
            {[0, 0.1, 0.22].map((delay, i) => (
              <motion.div key={i}
                className="absolute rounded-full border-2 border-[#D4AF37]"
                style={{ left: x, top: y, translateX: "-50%", translateY: "-50%" }}
                initial={{ width: 10, height: 10, opacity: 0.9 }}
                animate={{ width: 300 + i * 80, height: 300 + i * 80, opacity: 0 }}
                transition={{ duration: 0.8, delay, ease: "easeOut" }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
