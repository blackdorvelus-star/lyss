import lyssAvatar from "@/assets/lyss-avatar.png";
import { cn } from "@/lib/utils";

interface LyssAvatarProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

const sizeMap = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-12 h-12",
};

const LyssAvatar = ({ size = "sm", className, pulse }: LyssAvatarProps) => {
  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <img
        src={lyssAvatar}
        alt="Lyss — Adjointe IA"
        className={cn(sizeMap[size], "rounded-full object-cover ring-2 ring-primary/20")}
      />
      {pulse && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-1 ring-background" />
        </span>
      )}
    </div>
  );
};

export default LyssAvatar;
