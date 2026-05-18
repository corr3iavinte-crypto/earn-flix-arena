import { Link } from "@tanstack/react-router";
import promo1 from "@/assets/promo-1.jpg";
import promo2 from "@/assets/promo-2.jpg";
import promo3 from "@/assets/promo-3.jpg";
import promo4 from "@/assets/promo-4.jpg";

const IMAGES = [promo4, promo1, promo2, promo3];

export function FloatingPromos() {
  // duplicate the list so the marquee loops seamlessly
  const loop = [...IMAGES, ...IMAGES];
  return (
    <section className="-mx-4 overflow-hidden">
      <div className="flex w-max gap-4 px-4 animate-marquee">
        {loop.map((src, i) => (
          <Link
            to="/plans"
            key={i}
            className="group relative block h-48 w-32 shrink-0 overflow-hidden rounded-2xl shadow-elegant ring-1 ring-border float-card"
            style={{ animationDelay: `${(i % IMAGES.length) * 0.4}s` }}
          >
            <img
              src={src}
              alt={`Promoção VIP ${(i % IMAGES.length) + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white drop-shadow">
                Ative agora
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
