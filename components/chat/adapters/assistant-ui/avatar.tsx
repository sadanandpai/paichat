import Image from "next/image";
import type { ChatPersona } from "../../types";

type AvatarProps = {
  persona: ChatPersona;
  size: number;
  className?: string;
};

export function Avatar({ persona, size, className }: AvatarProps) {
  if (persona.image) {
    return (
      <Image
        src={persona.image}
        alt={persona.name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${className ?? ""}`}
    >
      {persona.initials}
    </span>
  );
}
