'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';

const images = [
  {
    src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80',
    alt: 'Tree planting drive',
    caption: 'Tree planting',
  },
  {
    src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    alt: 'Volunteers in community project',
    caption: 'Community outreach',
  },
  {
    src: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80',
    alt: 'Teaching session with children',
    caption: 'Teaching session',
  },
  {
    src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80',
    alt: 'Team discussion in outdoor setting',
    caption: 'Team huddle',
  },
  {
    src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80',
    alt: 'Volunteers working outdoors',
    caption: 'Field work',
  },
  {
    src: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80',
    alt: 'Group of volunteers hands together',
    caption: 'Team spirit',
  },
];

export function Gallery() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="gallery" className="bg-slate-50 py-20 sm:py-28 dark:bg-slate-800/50">
      <div
        ref={ref}
        className={`mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 motion-safe:transition-opacity motion-safe:duration-700 ${
          inView ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
          From the field
        </h2>
        <p className="mt-3 text-center text-slate-500 dark:text-slate-400">
          What volunteering with WeTheYuva looks like.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {images.map((img) => (
            <div key={img.alt} className="group relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div
                className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/40"
                aria-hidden="true"
              />
              <p className="absolute bottom-0 left-0 right-0 p-3 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {img.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
