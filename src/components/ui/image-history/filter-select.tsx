import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FilterSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FilterSelect({
  options,
  value = "",
  onChange,
  placeholder,
  className,
  ...props
}: FilterSelectProps) {
  return (
    <div className="relative group h-11">
      <select
        className={cn(
          "w-full h-11 px-4 py-0 rounded-lg border border-pixoo-purple/30 bg-gradient-to-r from-background/95 to-pixoo-purple/5 backdrop-blur-sm text-sm focus:border-pixoo-magenta/50 focus:ring-2 focus:ring-pixoo-purple/20 focus:outline-none transition-all duration-300 hover:border-pixoo-purple/40 hover:shadow-lg hover:shadow-pixoo-purple/10 appearance-none cursor-pointer pr-12",
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-background text-foreground">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-background text-foreground"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <div className="p-1.5 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
          <svg
            className="h-3.5 w-3.5 text-pixoo-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
