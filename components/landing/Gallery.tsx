'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';

interface GalleryImage {
  id: string;
  src: string;
  span: string;
}

const images: GalleryImage[] = [
  { id: 'volunteer-tree-planting', src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80', span: 'col-span-2 row-span-2' },
  { id: 'community-event', src: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&q=80', span: '' },
  { id: 'volunteers-group', src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80', span: '' },
  { id: 'team-activity', src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80', span: '' },
  { id: 'teaching-session', src: 'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=600&q=80', span: '' },
  { id: 'community-discussion', src: 'https://images.unsplash.com/photo-1551836022-deb4983ccfd0?w=600&q=80', span: '' },
];

export function Gallery() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="gallery" className="py-24 sm:py-32 bg-brand-bg">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-brand-primary uppercase tracking-wider">
            Gallery
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-brand-text">
            Moments That Matter
          </h2>
          <p className="mt-4 text-brand-muted">
            A glimpse into the energy, passion, and impact of our volunteer community in action.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group overflow-hidden rounded-2xl ${img.span} motion-safe:transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Image
                src={img.src}
                alt={`Volunteer activity — ${img.id.replace(/-/g, ' ')}`}
                width={600}
                height={600}
                className="object-cover aspect-square group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
