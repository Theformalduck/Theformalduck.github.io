"use client";

import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 12, suffix: "M+", prefix: "$", label: "Creator revenue", sub: "processed this year" },
  { value: 28, suffix: "K+", prefix: "", label: "Active creators", sub: "across 40+ countries" },
  { value: 94, suffix: "%", prefix: "", label: "Campaign success rate", sub: "for funded projects" },
  { value: 4.9, suffix: "/5", prefix: "", label: "Satisfaction score", sub: "from 1,200+ reviews" },
];

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1800, bounce: 0 });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, motionVal, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (v) => {
      if (ref.current) {
        const formatted = value % 1 !== 0 ? v.toFixed(1) : Math.floor(v).toString();
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
    return unsubscribe;
  }, [spring, value, prefix, suffix]);

  return (
    <span
      ref={ref}
      className="text-4xl sm:text-5xl font-bold text-gray-900"
      style={{ letterSpacing: "-0.04em" }}
    >
      {prefix}0{suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-gray-100"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center px-6 py-8"
            >
              <AnimatedNumber
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
              <p className="text-gray-900 text-sm font-semibold mt-2">{stat.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
