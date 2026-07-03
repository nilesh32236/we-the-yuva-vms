export function StatsBar() {
  const stats = [
    { number: '7,000+', label: 'Volunteers' },
    { number: '50,000+', label: 'Hours contributed' },
    { number: '200+', label: 'Communities reached' },
    { number: '15+', label: 'States across India' },
  ];

  return (
    <section className="bg-emerald-800 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-bold text-white sm:text-4xl">
                {stat.number}
              </p>
              <p className="mt-1.5 text-sm text-emerald-200/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
