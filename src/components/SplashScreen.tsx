import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import logo from "@/assets/logo-optimized.webp";

const SplashScreen = ({ onFinished }: { onFinished: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); setTimeout(onFinished, 400); return 100; }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onFinished]);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{ background: 'hsl(var(--ocean-deep))' }}>
      {/* Decorative orbs */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'hsl(var(--secondary))' }} />
      <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'hsl(var(--teal))' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <div className="rounded-full p-1 ring-2 ring-white/10" style={{ background: 'hsl(0 0% 100% / 0.1)' }}>
          <img src={logo} alt="Amruta Logo" className="h-20 w-20 rounded-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-center text-white" style={{ fontFamily: 'var(--font-serif)' }}>
          Amruta Hydrogeo Services
        </h1>
        <div className="w-56">
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'hsl(0 0% 100% / 0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ width: `${displayProgress}%`, background: 'linear-gradient(90deg, hsl(var(--secondary)), hsl(var(--teal)))' }}
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <p className="mt-2.5 text-center text-xs font-medium text-white/40">
            Loading… {displayProgress}%
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
