import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Lifegorithms';
    const emoji = searchParams.get('emoji') || '✨';
    const description = searchParams.get('description') || 'Stories • Insights • Adventures';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: '#0F172A',
          }}
        >
          {/* Animated gradient orbs */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-10%',
              width: '800px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
              filter: 'blur(80px)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-10%',
              width: '900px',
              height: '900px',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
              filter: 'blur(80px)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
              filter: 'blur(80px)',
              display: 'flex',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              padding: '80px',
              justifyContent: 'space-between',
            }}
          >
            {/* Spacer */}
            <div style={{ display: 'flex' }} />

            {/* Main content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
              }}
            >
              {/* Emoji with glow */}
              <div
                style={{
                  fontSize: '96px',
                  display: 'flex',
                  filter: 'drop-shadow(0 0 40px rgba(168, 85, 247, 0.5))',
                }}
              >
                {emoji}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  lineHeight: 1.1,
                  color: 'white',
                  display: 'flex',
                  letterSpacing: '-0.02em',
                  maxWidth: '900px',
                }}
              >
                {title}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '42px',
                  color: '#cbd5e1',
                  display: 'flex',
                  letterSpacing: '-0.01em',
                }}
              >
                {description}
              </div>
            </div>

            {/* Footer - by Arthur */}
            <div
              style={{
                display: 'flex',
                fontSize: '24px',
                color: '#64748b',
              }}
            >
              by Arthur Papailhau
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
