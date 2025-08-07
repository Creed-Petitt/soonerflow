"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WordRevealProps {
  text?: string;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}

export function WordReveal({ 
  text = "Linear is a better way to build products",
  className,
  delay = 0.2,
  children 
}: WordRevealProps) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: delay },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(10px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  if (children) {
    return (
      <motion.h1
        variants={container}
        initial="hidden"
        animate="visible"
        className={cn(
          "text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl",
          className
        )}
      >
        {children}
      </motion.h1>
    );
  }

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn(
        "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl",
        className
      )}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
          className="inline-block mr-3"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export default WordReveal;