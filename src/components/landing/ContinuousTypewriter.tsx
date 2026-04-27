"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

interface TypewriterProps {
  text: string;
  speed?: number;
  pauseDuration?: number;
}

export function ContinuousTypewriter({ 
  text, 
  speed = 100, 
  pauseDuration = 2000 
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayedText.length < text.length) {
      timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
    } else if (isDeleting && displayedText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length - 1));
      }, speed / 2);
    } else if (!isDeleting && displayedText.length === text.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && displayedText.length === 0) {
      timeout = setTimeout(() => setIsDeleting(false), pauseDuration / 2);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, text, speed, pauseDuration]);

  return (
    <>
      <span dangerouslySetInnerHTML={{ __html: displayedText.replace(/،/g, '،<br class="hidden md:block" />') }} />
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-[3px] h-[1em] bg-white translate-y-[0.1em] mx-1 mr-1 shadow-[0_0_8px_white]"
      />
    </>
  );
}
