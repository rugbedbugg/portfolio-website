import { useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  persistentCursor?: boolean;
}

const TypewriterText = ({
  text,
  speed = 70,
  delay = 0,
  persistentCursor = false,
}: TypewriterTextProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(text);
      return;
    }
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay, prefersReducedMotion, text]);

  useEffect(() => {
    if (prefersReducedMotion || !started) return;
    if (displayed.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [displayed, text, speed, started, prefersReducedMotion]);

  return (
    <span className="inline-flex items-baseline">
      <span>{displayed}</span>
      {(persistentCursor || displayed.length < text.length) && (
        <span
          className="inline-block h-[0.16em] w-[0.72em] bg-current animate-blink ml-[0.08em] translate-y-[0.2em]"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default TypewriterText;
