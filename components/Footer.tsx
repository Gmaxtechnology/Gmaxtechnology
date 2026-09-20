import Link from 'next/link';
import { WHATSAPP_NUMBER_1, WHATSAPP_NUMBER_2, buildGeneralWhatsAppLink } from '@/lib/whatsapp';

const categories = ['Laptops', 'Desktop Pc', 'Office Equipment', 'Home Appliances', 'Networking Gadgets'];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-12 grid gap-10 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <img src="/logo.png" alt="GMAX Technologies" className="w-9 h-9 rounded" />
            <div className="leading-tight">
              <p className="text-cream font-display">GMAX Technologies</p>
              <p className="text-xs text-cream/50">providing Quality IT Services</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            Providing IT solutions with cutting-edge technology to enhance your digital experience.
          </p>
          <div className="flex gap-4 mt-4 text-cream/70">
            <a href="#" aria-label="Facebook" className="hover:text-gold">Facebook</a>
            <a href="#" aria-label="Twitter" className="hover:text-gold">Twitter</a>
            <a href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_1)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-gold">
              WhatsApp
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-cream text-sm mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-gold">Home</Link></li>
            <li><Link href="/products" className="hover:text-gold">Products</Link></li>
            <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-cream text-sm mb-3">Product Categories</h4>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c}>
                <Link href={`/products?category=${encodeURIComponent(c)}`} className="hover:text-gold">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-cream text-sm mb-3">Contact Us</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_1)} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                +234 802 849 4730
              </a>
            </li>
            <li>
              <a href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_2)} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                +234 803 395 8523
              </a>
            </li>
            <li className="text-cream/70">10, Oremeji Street, Off Simbiat Abiola Street, Ikeja, Lagos, Nigeria.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 text-center text-xs py-4">
        © {new Date().getFullYear()} Gmax Technologies Ltd. All rights reserved.
      </div>
    </footer>
  );
}
