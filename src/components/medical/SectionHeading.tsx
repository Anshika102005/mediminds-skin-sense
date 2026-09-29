import React from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export const SectionHeading: React.FC<Props> = ({ eyebrow, title, subtitle, align = "left" }) => (
  <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-2xl mb-8`}>
    {eyebrow && (
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0F766E] mb-2">{eyebrow}</p>
    )}
    <h2 className="text-[28px] sm:text-[33px] font-bold text-[#17324D] tracking-tight leading-tight">
      {title}
    </h2>
    {subtitle && (
      <p className="text-[16px] text-[#5F7182] mt-2 leading-relaxed">{subtitle}</p>
    )}
  </div>
);

export default SectionHeading;
