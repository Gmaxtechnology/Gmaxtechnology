'use client';
import { useState } from 'react';

export default function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-cream rounded-lg flex items-center justify-center">
        <span className="text-navy/30 text-sm">No image yet</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square bg-cream rounded-lg overflow-hidden mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={productName} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded overflow-hidden border-2 shrink-0 ${
                i === active ? 'border-navy' : 'border-transparent hover:border-navy/30'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
