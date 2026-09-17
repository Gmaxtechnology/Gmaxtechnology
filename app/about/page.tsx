import Link from 'next/link';

const features = [
  {
    icon: '☀️',
    title: 'Premium Quality',
    desc: 'All our products undergo rigorous quality testing to ensure long-lasting performance.',
  },
  {
    icon: '🚚',
    title: 'Fast Delivery',
    desc: 'Get your tech gadgets delivered to your doorstep within 24-48 hours.',
  },
  {
    icon: '🛠️',
    title: '24/7 Support',
    desc: 'Our customer support team is available round the clock to assist you.',
  },
  {
    icon: '🛡️',
    title: 'Extended Warranty',
    desc: 'Enjoy peace of mind with our extended warranty coverage on all products.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="max-w-4xl mx-auto px-5 py-16 text-center">
        <h1 className="font-display text-3xl text-charcoal mb-2">
          Why Choose <span className="text-navy">Gmax Technologies</span>
        </h1>
        <p className="text-charcoal/60 mb-12">
          We're committed to providing the best tech gadgets with exceptional service
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-navy/10 rounded-lg p-5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-display text-charcoal mt-3 mb-1">{f.title}</h3>
              <p className="text-sm text-charcoal/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-cream">
        <div className="max-w-3xl mx-auto px-5 py-16 text-center">
          <h2 className="font-display text-2xl sm:text-3xl mb-3">Ready to Upgrade Your Tech?</h2>
          <p className="text-cream/70 mb-7">
            Join thousands of satisfied customers who trust Gmax Technologies for premium gadgets and exceptional service.
          </p>
          <Link href="/products" className="inline-block bg-white text-navy px-7 py-3 rounded font-medium hover:bg-cream">
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}
