import { ImageResponse } from 'next/og';
import { OgImage } from '@/lib/og-image';
import { getStaticOgImages } from '@/lib/og-images';

// Unlike the query-based API, these images depend only on bundled content.
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return getStaticOgImages().map(({ id }) => ({ id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const image = getStaticOgImages().find((candidate) => candidate.id === id);
  if (!image) return new Response('Not Found', { status: 404 });

  return new ImageResponse(<OgImage {...image.content} />, {
    width: 1200,
    height: 630,
  });
}
