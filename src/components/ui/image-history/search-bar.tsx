import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder, ...props }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-8 pr-2 py-1 rounded border bg-muted text-sm"
        {...props}
      />
      <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
    </div>
  );
}