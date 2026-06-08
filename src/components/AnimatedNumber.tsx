import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, format, className = "" }: AnimatedNumberProps) {
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [springValue]);

  return (
    <motion.span className={className}>
      {format ? format(displayValue) : Math.round(displayValue)}
    </motion.span>
  );
}
