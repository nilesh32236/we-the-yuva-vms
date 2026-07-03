'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { Camera } from 'lucide-react';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
  span: string;
  height: string;
}

const images: GalleryImage[] = [
  {
    id: 'tree-planting',
    src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=85',
    alt: 'Volunteers planting trees in a community forest drive',
    caption: 'Tree Plantation Drive — Mumbai',
    span: 'col-span-2 row-span-2',
    height: 'h-80',
  },
  {
    id: 'community-cleanup',
    src: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&q=80',
    alt: 'Young volunteers cleaning a public space together',
    caption: 'Clean India Campaign',
    span: '',
    height: 'h-36',
  },
  {
    id: 'group-celebration',
    src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80',
    alt: 'Volunteer group celebrating their community impact',
    caption: 'Volunteer Recognition Day',
    span: '',
    height: 'h-36',
  },
  {
    id: 'workshop',
    src: 'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=600&q=80',
    alt: 'Youth attending leadership workshop',
    caption: 'Leadership Training Workshop',
    span: '',
    height: 'h-40',
  },
  {
    id: 'community-meeting',
    src: 'https://images.unsplash.com/photo-1551836022-deb4983ccfd0?w=600&q=80',
    alt: 'Community discussion circle with volunteers',
    caption: 'Civic Dialogue Sessions',
    span: '',
    height: 'h-40',
  },
  {
    id: 'team-activity',
    src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
    alt: 'Team of volunteers in outdoor activity',
    caption: 'Youth Leadership Camp',
    span: 'col-span-2',
    height: 'h-44',
  },
];

function GalleryCard({ img, delay }: { img: GalleryImage; delay: number }) {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`relative group overflow-hidden rounded-2xl ${img.span} ${img.height} motion-safe:transition-all motion-safe:duration-700 cursor-pointer`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Invisible inView trigger — the outer div */}
      <div className={`absolute inset-0 motion-safe:transition-all motion-safe:duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${delay}ms` }} />

      <Image
        src={img.src}
        alt={img.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="text-sm font-semibold text-white leading-tight">{img.caption}</span>
        </div>
      </div>
    </div>
  );
}

export function Gallery() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="gallery" className="py-24 sm:py-32 bg-white dark:bg-slate-950">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 motion-safe:transition-all motion-safe:duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">
            Gallery
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Moments That
            <span className="text-emerald-600 dark:text-emerald-400"> Matter</span>
          </h2>
          <p className="mt-5 text-slate-500 dark:text-slate-400 leading-relaxed">
            A glimpse into the energy, passion, and impact of our volunteer community across India — every photo a story worth telling.
          </p>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[160px] gap-4">
          {images.map((img, i) => (
            <GalleryCard key={img.id} img={img} delay={i * 80} />
          ))}
        </div>

        {/* Bottom tag */}
        <div
          className={`mt-10 text-center motion-safe:transition-all motion-safe:duration-700 delay-500 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Hover over any photo to see its story · Images from volunteer events across India
          </p>
        </div>
      </div>
    </section>
  );
}
