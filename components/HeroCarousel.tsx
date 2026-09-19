'use client';
import { useEffect, useState } from 'react';

// Add your own photos here, in order — this list is the ONLY place you
// need to edit to add, remove, or reorder hero images. Files live in
// /public/hero/ (see the file names below). To add more:
//   1. Drop a new image into public/hero/, named e.g. hero-3.jpg
//   2. Add '/hero/hero-3.jpg' to this array
// That's it — no other code changes needed. Landscape photos (roughly
// 1900x800px, or anything close to that wide/short shape) look best;
// Next.js will crop taller/narrower images to fit.
const HERO_IMAGES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  // '/hero/hero-3.jpg',
  // '/hero/hero-4.jpg',
  // '/hero/hero-5.jpg',
  // '/hero/hero-6.jpg',
  // '/hero/hero-7.jpg',
  // '/hero/hero-8.jpg',
];

const SLIDE_DURATION_MS = 4500;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[1896/798] max-h-[520px] overflow-hidden bg-navy">
      {HERO_IMAGES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt="GMAX Technologies"
          onError={() => setBroken((prev) => new Set(prev).add(i))}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index && !broken.has(i) ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-navy-dark/10" />
    </div>
  );
}
