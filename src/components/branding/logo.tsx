import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  customLogo?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  width = 40,
  height = 40,
  className,
  customLogo,
  showText = true,
}) => {
  if (customLogo) {
    return (
      <Link href="/" className="cursor-pointer">
        <div
          className={cn("flex items-center hover:opacity-80 transition-opacity", showText ? "gap-2" : "", className)}
        >
          <img
            src={customLogo}
            alt="Pixoo Logo"
            width={width}
            height={height}
            className="object-contain flex-shrink-0 select-none"
            style={{
              imageRendering: "crisp-edges",
              filter: "none",
              backfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
            draggable={false}
          />
          {showText && (
            <span className="bg-gradient-to-r from-pixoo-purple to-pixoo-magenta bg-clip-text text-transparent font-bold text-lg">
              Pixoo
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className="cursor-pointer">
      <div
        className={cn("flex items-center hover:opacity-80 transition-opacity", showText ? "gap-2" : "", className)}
      >
        <div
          className="bg-pixoo-dark text-white rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 select-none"
          style={{
            width,
            height,
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          P
        </div>
        {showText && (
          <span className="font-bold text-xl text-foreground">Pixoo</span>
        )}
      </div>
    </Link>
  );
};

export default Logo;
