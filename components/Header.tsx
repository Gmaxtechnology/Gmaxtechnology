'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useCart } from './CartContext';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const links = [
    { href: '/products', label: 'Products' },
    { href: '/about', label: 'About' },
  ];

  return (
    <div className="sticky top-0 z-40">
      {/* Announcement bar */}
      <div className="bg-charcoal text-cream text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto px-5 h-9 flex items-center justify-between">
          <span className="text-gold">Welcome to GMAX Online Store!</span>
          <span className="hidden sm:inline text-cream/70">
            Opening Hours: <span className="text-green-400">8:00 AM - 10:00 PM</span> (Monday - Friday)
          </span>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-navy/10">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="GMAX Technologies" width={40} height={40} className="rounded" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg text-navy tracking-tight">GMAX Technologies</span>
              <span className="text-[11px] text-charcoal/50">providing Quality IT Services</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-charcoal">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-navy transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative text-sm text-charcoal hover:text-navy transition-colors">
              Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-3 bg-navy text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            <Link href="/login" className="hidden sm:inline text-sm text-charcoal hover:text-navy transition-colors">
              My Account
            </Link>
            <button className="md:hidden text-navy" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              ☰
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden flex flex-col gap-1 px-5 pb-4 text-sm text-charcoal">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="py-2 border-t border-navy/10" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="py-2 border-t border-navy/10" onClick={() => setOpen(false)}>
              My Account
            </Link>
          </nav>
        )}
      </header>
    </div>
  );
}
