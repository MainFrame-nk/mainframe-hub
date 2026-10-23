"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: "purple" | "cyan" | "crimson";
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "cyan",
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const colorMap = {
    purple: "rgba(139, 92, 246, 0.18)",
    cyan: "rgba(0, 240, 255, 0.15)",
    crimson: "rgba(255, 42, 95, 0.15)",
  };

  const borderHoverMap = {
    purple: "hover:border-cyber-purple/50",
    cyan: "hover:border-cyber-cyan/50",
    crimson: "hover:border-cyber-crimson/50",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl bg-obsidian-card/90 backdrop-blur-xl border border-obsidian-border transition-colors duration-300 ${borderHoverMap[spotlightColor]} ${className}`}
    >
      {/* Свечение, следующее за курсором */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, ${colorMap[spotlightColor]}, transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}