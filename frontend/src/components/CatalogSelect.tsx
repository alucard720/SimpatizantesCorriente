import { useId } from "react";
import type { CatalogItem } from "../types";
import { catalogLabel } from "../services/catalog";

export function CatalogSelect({
  label, items, value, onChange, disabled = false, required = false, name,
}: {
  label: string;
  items: CatalogItem[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id}>
      {label}{required ? " *" : ""}
      <select
        id={id}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecciona una opción</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{catalogLabel(item)}</option>
        ))}
      </select>
    </label>
  );
}
