import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  ...props
}: SearchBarProps) {
  return (
    <div className="relative w-full group h-11">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
        <div className="p-1.5 rounded-md bg-gradient-to-br from-pixoo-purple/20 to-pixoo-magenta/20">
          <Search className="h-3.5 w-3.5 text-pixoo-purple" />
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-11 pl-12 pr-4 py-0 rounded-lg border border-pixoo-purple/30 bg-gradient-to-r from-background/95 to-pixoo-purple/5 backdrop-blur-sm text-sm focus:border-pixoo-magenta/50 focus:ring-2 focus:ring-pixoo-purple/20 focus:outline-none transition-all duration-300 hover:border-pixoo-purple/40 hover:shadow-lg hover:shadow-pixoo-purple/10 placeholder:text-muted-foreground/70"
        {...props}
      />
    </div>
  );
}
