import { useState, useEffect } from "react";
import logo from "@/assets/logo-optimized.webp";

const SplashScreen = ({ onFinished }: { onFinished: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinished, 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onFinished]);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(210,40%,96%)]">
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-full bg-white p-3 shadow-lg">
          <img src={logo} alt="Amruta Logo" className="h-24 w-24 rounded-full object-cover" />
        </div>
        <h1
          className="text-2xl font-bold tracking-wide text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: "hsl(224, 76%, 48%)" }}
        >
          Amruta Hydrogeo Services
        </h1>
        <div className="w-64">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(210,30%,88%)]">
            <div
              className="h-full rounded-full transition-all duration-200 ease-out"
              style={{
                width: `${displayProgress}%`,
                backgroundColor: "hsl(224, 76%, 48%)",
              }}
            />
          </div>
          <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
            Loading… {displayProgress}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
