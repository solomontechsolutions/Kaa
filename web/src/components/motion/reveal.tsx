"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Direction = "up" | "scale" | "left" | "right";

/**
 * Scroll reveal.
 *
 * One IntersectionObserver per element, disconnected on first intersection so
 * nothing keeps observing after it has done its job. The displaced start state
 * and the transition live in globals.css under `[data-reveal]`, which means a
 * server-rendered page still paints correctly if JavaScript never arrives:
 * the observer only ever adds `data-revealed`.
 *
 * Respects prefers-reduced-motion by revealing immediately.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  direction?: Direction;
  /** Milliseconds, for staggering siblings. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.setAttribute("data-revealed", "true");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.setAttribute("data-revealed", "true");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // One component renders four tag names, so the ref is narrowed per call.
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      data-reveal={direction}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Reveals its children one after another. Cheaper than hand-tuning a delay on
 * every card, and keeps the rhythm consistent across sections.
 */
export function RevealGroup({
  children,
  className,
  step = 90,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
  direction?: Direction;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <Reveal direction={direction} delay={i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Hero headline that settles word by word. Used once per page at most.
 */
export function RevealWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <Reveal as="span" delay={i * 55} className="inline-block">
            <span className="inline-block">{word}</span>
          </Reveal>
          {i < words.length - 1 && " "}
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Counts up to a figure when it scrolls into view. Kaa states a lot of numbers
 * and a static one reads as decoration; a moving one reads as a measurement.
 */
export function CountUp({
  to,
  duration = 1400,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        // Reduced motion still gets the figure, just without the count.
        if (reduced) {
          setValue(to);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // Ease out, so it decelerates into the final figure.
          setValue(to * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {prefix}
      {value.toLocaleString("en", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
