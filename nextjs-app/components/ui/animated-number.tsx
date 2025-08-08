"use client";

import { useEffect, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";

interface AnimatedNumberProps {
  value: number;
  precision?: number;
  format?: (value: number) => string;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  mass?: number;
  stiffness?: number;
  damping?: number;
}

export function AnimatedNumber({
  value,
  precision = 0,
  format,
  onAnimationStart,
  onAnimationComplete,
  mass = 1,
  stiffness = 100,
  damping = 40,
}: AnimatedNumberProps) {
  const prevValueRef = useRef(value);
  const hasStartedRef = useRef(false);

  const springProps = useSpring({
    from: { number: prevValueRef.current },
    to: { number: value },
    config: {
      mass,
      tension: stiffness,
      friction: damping,
    },
    onStart: () => {
      if (!hasStartedRef.current && onAnimationStart) {
        hasStartedRef.current = true;
        onAnimationStart();
      }
    },
    onRest: () => {
      if (hasStartedRef.current && onAnimationComplete) {
        hasStartedRef.current = false;
        onAnimationComplete();
      }
      prevValueRef.current = value;
    },
  });

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const displayValue = springProps.number.to((n) => {
    const rounded = parseFloat(n.toFixed(precision));
    return format ? format(rounded) : rounded.toString();
  });

  return <animated.span>{displayValue}</animated.span>;
}