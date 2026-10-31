import { ImageResponse } from 'next/og';
import { OgImage, readOgImageContent } from '@/lib/og-image';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    return new ImageResponse(
      <OgImage {...readOgImageContent(searchParams)} />,
      {
        width: 1200,
        height: 630,
        headers: {
          // Cache each query-specific image at the CDN, while browsers revalidate.
          'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
