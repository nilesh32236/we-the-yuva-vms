import { createSerwistRoute } from '@serwist/turbopack';

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    additionalPrecacheEntries: [{ url: '/offline', revision: '1' }],
    swSrc: 'app/sw.ts',
    useNativeEsbuild: true,
  }
);
