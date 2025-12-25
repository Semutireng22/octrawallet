import { useEffect, useState, useRef } from "react";

export function useCountUp(
  end: number,
  duration: number = 2000,
  start: number = 0
) {
  const [count, setCount] = useState(start);
  const requestRef = useRef<number>(undefined);
  const startTimeRef = useRef<number | null>(null);
  const endRef = useRef(end);

  useEffect(() => {
    // If end hasn't changed, don't restart animation
    // Note: useEffect dependency [end] usually handles this, but we add safety.
    // Actually, if we want to animate ONLY when end changes, this is standard.
    // The issue "Max update depth" usually means the component re-renders,
    // which causes this effect to run, which sets state, which re-renders...
    // This implies 'end' IS changing every render.

    // Check if end is effectively the same (tolerance for floats)
    if (Math.abs(end - endRef.current) < 0.000001 && requestRef.current) {
      return;
    }
    endRef.current = end;
    startTimeRef.current = null;

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = Math.min((time - startTimeRef.current) / duration, 1);

      // Ease Out Quart
      const ease = 1 - Math.pow(1 - progress, 4);

      const currentCount = start + (end - start) * ease;
      setCount(currentCount);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [end, duration, start]);

  return count;
}
