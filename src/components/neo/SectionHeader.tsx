import { motion } from "framer-motion";

export default function SectionHeader({
  index,
  title,
  subtitle,
  withCursor,
  center = true,
}: {
  index: string;
  title: string;
  subtitle?: string;
  withCursor?: boolean;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={center ? "text-center" : ""}
    >
      <div
        className="inline-flex items-center gap-2"
        style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#A8A096", letterSpacing: "1px" }}
      >
        <span className="h-px w-6 bg-[#A8A096]" />
        {index}
        <span className="h-px w-6 bg-[#A8A096]" />
      </div>
      <h2
        className={`mt-4 ${withCursor ? "cursor-blink" : ""}`}
        style={{
          fontFamily: "Instrument Serif",
          fontWeight: 400,
          fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          color: "#1A1714",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mt-4 mx-auto max-w-2xl"
          style={{ fontFamily: "Inter", fontSize: 16, lineHeight: 1.55, color: "#5A5247" }}
        >
          {subtitle}
        </p>
      )}
      {center && <div className="mt-6 mx-auto h-px w-12 bg-[#E8600A]" />}
    </motion.div>
  );
}
