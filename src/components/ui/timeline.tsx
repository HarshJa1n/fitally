"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full h-64 overflow-y-auto font-sans"
      ref={containerRef}
    >
      <div ref={ref} className="relative pb-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-4 gap-4"
          >
            <div className="flex flex-col items-center z-10">
              <div className="h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mt-2 text-center min-w-[60px]">
                {item.title}
              </h3>
            </div>

            <div className="flex-1 pb-4">
              {item.content}
            </div>
          </div>
        ))}
        <div className="absolute left-4 top-0 w-[2px] h-full bg-border">
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-primary rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
