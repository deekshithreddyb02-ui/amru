import { ReactNode } from "react";

/** Split free-form text into bullet points.
 *  Priority: explicit bullets / numbered lines > newlines > sentence splits. */
export function toBullets(text: string): string[] {
  if (!text) return [];
  const trimmed = String(text).trim();
  if (!trimmed) return [];

  // Lines that already look like a list
  const lines = trimmed
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*([-*•●·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  // Otherwise split sentences
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.length ? sentences : [trimmed];
}

type Props = {
  text?: string | null;
  empty?: ReactNode;
  className?: string;
};

export default function Bulleted({ text, empty = "", className = "" }: Props) {
  const items = toBullets(text || "");
  if (items.length === 0) return <>{empty}</>;
  if (items.length === 1) return <span className={className}>{items[0]}</span>;
  return (
    <ul className={`list-disc pl-4 space-y-0.5 ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="break-words">{it}</li>
      ))}
    </ul>
  );
}
