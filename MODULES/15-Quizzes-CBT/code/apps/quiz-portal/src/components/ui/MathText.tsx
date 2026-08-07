"use client";
import { InlineMath, BlockMath } from "react-katex";
import { Fragment } from "react";

// Renders mixed text + LaTeX. Supports $...$ inline and $$...$$ block.
export default function MathText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  if (!text.includes('$')) return <span className={className}>{text}</span>;

  // Split on $$...$$ first (block), then $...$ (inline)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length) {
    const blockMatch = remaining.match(/\$\$([^$]+)\$\$/);
    const inlineMatch = remaining.match(/\$([^$]+)\$/);
    let nextMatch: RegExpMatchArray | null = null;
    let isBlock = false;
    if (blockMatch && (!inlineMatch || (blockMatch.index ?? Infinity) <= (inlineMatch.index ?? Infinity))) {
      nextMatch = blockMatch; isBlock = true;
    } else if (inlineMatch) {
      nextMatch = inlineMatch; isBlock = false;
    }

    if (!nextMatch) {
      parts.push(<Fragment key={key++}>{remaining}</Fragment>);
      break;
    }
    if (nextMatch.index! > 0) {
      parts.push(<Fragment key={key++}>{remaining.slice(0, nextMatch.index)}</Fragment>);
    }
    try {
      if (isBlock) parts.push(<BlockMath key={key++} math={nextMatch[1]}/>);
      else parts.push(<InlineMath key={key++} math={nextMatch[1]}/>);
    } catch {
      parts.push(<Fragment key={key++}>{nextMatch[0]}</Fragment>);
    }
    remaining = remaining.slice(nextMatch.index! + nextMatch[0].length);
  }
  return <span className={className}>{parts}</span>;
}
