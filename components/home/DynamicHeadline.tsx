"use client";

import React, { useState, useEffect } from "react";

const TRANSLATIONS = [
  { text: "Expert legal help.", lang: "en" },
  { text: "सही कानूनी मदद।", lang: "hi" }, // Hindi: Right legal help
  { text: "योग्य कायदेशीर मदत।", lang: "mr" }, // Marathi: Right legal help
  { text: "சரியான சட்ட உதவி.", lang: "ta" }, // Tamil: Right legal help
  { text: "ശരിയായ നിയമസഹായം.", lang: "ml" }, // Malayalam: Right legal help
  { text: "సరైన న్యాయ సహాయం.", lang: "te" }, // Telugu: Right legal help
  { text: "সঠিক আইনি সাহায্য।", lang: "bn" }, // Bengali: Right legal help
];

export function DynamicHeadline() {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (isPaused) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % TRANSLATIONS.length);
        setIsFading(false);
      }, 500); // 500ms fade transition
    }, 3500); // Hold for 3.5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="text-center max-w-3xl mx-auto flex flex-col items-center justify-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary font-semibold tracking-tight leading-[1.2] flex flex-col items-center">
        <span>Find the right lawyer.</span>
        <span
          className={`text-brass transition-opacity duration-500 min-h-[1.5em] flex items-center justify-center ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
          aria-live="polite"
          lang={TRANSLATIONS[index].lang}
        >
          {TRANSLATIONS[index].text}
        </span>
      </h1>
    </div>
  );
}
