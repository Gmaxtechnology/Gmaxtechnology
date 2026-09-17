'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-navy text-cream px-5 py-2.5 rounded font-medium hover:bg-navy-light"
    >
      Print / Save as PDF
    </button>
  );
}
