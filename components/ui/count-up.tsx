"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string; // To allow styling the span/h1 directly
  decimals?: number;
}

export function CountUp({
  value,
  duration = 2000,
  className,
  decimals = 2,
}: CountUpProps) {
  const [count, setCount] = useState(0); // Start at 0
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(undefined);

  useEffect(() => {
    // If value matches current displayed, no need to animate
    if (Math.abs(value - countRef.current) < 0.000001) {
      setCount(value);
      return;
    }

    const startValue = countRef.current; // Animate from last known value to prevent jumping
    const endValue = value;
    startTimeRef.current = null;

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = Math.min((time - startTimeRef.current) / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * ease;

      setCount(current);
      countRef.current = current;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Ensure exact final value
        countRef.current = endValue;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
