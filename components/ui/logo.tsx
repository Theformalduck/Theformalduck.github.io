export function SelloraIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-5 -5 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="rotate(10, 50, 55)">
        {/* Price tag body — pointed pentagon top, rounded rectangle bottom */}
        <path
          d="M50 5 Q64 13 73 24 Q83 24 83 36 L83 87 Q83 95 75 95 L25 95 Q17 95 17 87 L17 36 Q17 24 27 24 Q36 13 50 5 Z"
          fill="#3b9ded"
        />
        {/* Circle hole at top of tag */}
        <circle cx="50" cy="20" r="6" fill="white" />
        {/* Back cloud — medium, left-center */}
        <path
          d="M20 72 C18 63 21 57 28 55 C26 49 32 45 39 48 C43 43 51 44 53 50 C57 47 61 53 59 60 L58 72 Z"
          fill="white"
        />
        {/* Small cloud — right side */}
        <path
          d="M62 72 C60 65 63 59 69 58 C68 53 74 51 78 55 C82 53 84 60 82 66 L80 72 Z"
          fill="white"
        />
        {/* Front cloud — large, fills lower portion */}
        <path
          d="M17 95 C15 82 16 72 24 68 C20 58 28 52 38 54 C36 46 45 41 56 45 C61 40 72 41 74 51 C82 51 87 61 85 71 L83 95 Z"
          fill="white"
        />
      </g>
    </svg>
  );
}

export function SelloraLogo({
  size = 32,
  textSize = "text-xl",
  textColor = "text-gray-900",
  className,
}: {
  size?: number;
  textSize?: string;
  textColor?: string;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <SelloraIcon size={size} />
      <span className={`font-bold ${textSize} ${textColor}`}>Sellora</span>
    </span>
  );
}
