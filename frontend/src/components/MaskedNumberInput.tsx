import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "onKeyDown" | "maxLength"> & {
  groups: readonly number[];
};

export function formatNumber(value: string, groups: readonly number[]) {
  const digits = value.replace(/\D/g, "").slice(0, groups.reduce((sum, size) => sum + size, 0));
  const parts: string[] = [];
  let offset = 0;
  for (const size of groups) {
    const part = digits.slice(offset, offset + size);
    if (part) parts.push(part);
    offset += size;
  }
  return parts.join("-");
}

export function MaskedNumberInput({ groups, ...props }: Props) {
  const format = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const digitsBeforeCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length;
    const formatted = formatNumber(input.value, groups);
    input.value = formatted;
    let cursor = 0;
    let digits = 0;
    while (cursor < formatted.length && digits < digitsBeforeCursor) {
      if (/\d/.test(formatted[cursor])) digits++;
      cursor++;
    }
    input.setSelectionRange(cursor, cursor);
  };

  const handleDelete = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const start = input.selectionStart;
    if (start === null || start !== input.selectionEnd || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    // Include the adjacent digit when deleting a separator, so it is not simply reinserted.
    if (event.key === "Backspace" && input.value[start - 1] === "-") {
      input.setSelectionRange(start - 2, start);
    } else if (event.key === "Delete" && input.value[start] === "-") {
      input.setSelectionRange(start, start + 2);
    }
  };

  return <input {...props} inputMode="numeric" onChange={format} onKeyDown={handleDelete} />;
}
