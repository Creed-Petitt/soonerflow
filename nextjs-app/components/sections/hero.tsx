"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRouter } from "next/navigation";

interface HeroProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Hero({ className, children }: HeroProps) {
  const { openModal } = useAuthModal();
  const router = useRouter();

  const handleGetStarted = () => {
    openModal();
  };

  const handleTryDemo = () => {
    // Just redirect to scheduler - no demo mode needed
    router.push("/scheduler");
  };

  return (
    <div
      className={cn(
        "relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black",
        className
      )}
    >
      <BackgroundBeams />
      <div className="relative z-50 w-full max-w-5xl mx-auto px-4 text-center -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-white tracking-tight">
            SoonerFlow
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-6 font-light">
            Your path to graduation, visualized
          </p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            The comprehensive degree planner for OU students. Track requirements, plan schedules, 
            and visualize prerequisites. See your entire academic journey in one beautiful flow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-black hover:bg-gray-200 transition-all px-8 py-3 text-lg font-medium"
            >
              Get Started
            </Button>
            <Button
              onClick={handleTryDemo}
              size="lg"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-900/50 transition-all px-8 py-3 text-lg"
            >
              Try Demo
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}