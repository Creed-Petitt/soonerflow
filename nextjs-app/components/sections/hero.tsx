"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WordReveal } from "@/components/prismui/word-reveal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useRouter } from "next/navigation";

interface HeroProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Hero({ className, children }: HeroProps) {
  const { openModal } = useAuthModal();
  const router = useRouter();

  // Placeholder for app screenshots
  const slides = [
    { title: "Visual Schedule Builder", description: "Drag and drop classes with real-time conflict detection" },
    { title: "Professor Ratings", description: "Integrated RateMyProfessor scores for informed decisions" },
    { title: "Degree Progress Tracking", description: "Track your requirements and graduate on time" },
    { title: "Smart Lab Pairing", description: "Automatically match labs with your lecture sections" },
  ];

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
        "relative flex flex-col items-center justify-start overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white",
        className
      )}
    >
      {/* Light mode gradient background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white via-gray-50/30 to-white" />

      {/* Animated Gradient Blob - adjusted for light mode */}
      <motion.div
        className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.15, 0.2],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Content Container with better padding */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 text-center py-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <WordReveal
            text="SoonerSync is the best way to plan your OU schedule and track degree progress"
            className="mb-8 text-gray-900"
            delay={0.2}
          />

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 2.5 }}
            className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
          >
            Build your perfect semester schedule with conflict detection, professor ratings, 
            and automatic lab pairing. Track your degree progress and graduate on time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800 transition-all px-8"
            >
              Get Started
            </Button>
            <Button
              onClick={handleTryDemo}
              size="lg"
              variant="outline"
              className="border-gray-300 text-gray-900 hover:bg-gray-100 transition-all px-8"
            >
              Try Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* App Preview Carousel */}
        <motion.div
          className="mt-20 pb-20 relative"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.5 }}
        >
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {slides.map((slide, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                      <div className="h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-12">
                        <div className="text-center max-w-2xl">
                          <div className="mb-8 mx-auto w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                            <span className="text-6xl font-bold text-gray-300">
                              {index + 1}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {slide.title}
                          </h3>
                          <p className="text-gray-600 text-lg">
                            {slide.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/90 hover:bg-white border-gray-300" />
            <CarouselNext className="right-4 bg-white/90 hover:bg-white border-gray-300" />
          </Carousel>
        </motion.div>
      </div>
    </div>
  );
}