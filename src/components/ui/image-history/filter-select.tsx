import { SelectHTMLAttributes } from "react";

interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterSelect({ options, value = "", onChange, placeholder, ...props }: FilterSelectProps) {
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      onChange={e => onChange(e.target.value)}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}