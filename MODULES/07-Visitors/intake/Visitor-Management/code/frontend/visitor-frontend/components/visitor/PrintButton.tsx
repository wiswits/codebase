"use client";

interface PrintButtonProps {
  label?: string;
}

export default function PrintButton({
  label = "Print Pass",
}: PrintButtonProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      className="pass-print-button"
      onClick={handlePrint}
    >
      {label}
    </button>
  );
}