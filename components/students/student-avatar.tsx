import { UserRound } from "lucide-react";
import { getStudentAvatarKind } from "@/lib/domain/ui-rules";

const SIZE_CLASSES = {
  sm: "size-10",
  md: "size-12",
  lg: "size-20",
} as const;

export function StudentAvatar({
  jenisKelamin,
  name,
  size = "md",
  animate = true,
}: {
  jenisKelamin: string;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  animate?: boolean;
}) {
  const avatar = getStudentAvatarKind(jenisKelamin);
  const className = `grid ${SIZE_CLASSES[size]} shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#eeeafd] ${
    animate ? "animate-breathe shadow-sm" : ""
  } transition-all duration-300 hover:scale-110`;

  if (avatar === "neutral") {
    return (
      <div
        className={`${className} text-primary`}
        role="img"
        aria-label={`Avatar netral untuk ${name}`}
      >
        <UserRound className={size === "lg" ? "size-8" : "size-5"} aria-hidden="true" />
      </div>
    );
  }

  const characterName = avatar === "eja" ? "Eja" : "Eva";
  return (
    <div className={className}>
      <img
        src={`/avatars/${avatar}.png`}
        alt={`Avatar ${characterName} untuk ${name}`}
        className="h-full w-full object-contain p-1 transition-transform duration-300 hover:rotate-3"
      />
    </div>
  );
}
