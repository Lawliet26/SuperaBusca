import React from 'react';

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.6s infinite',
  borderRadius: 6,
};

export const SkeletonCard: React.FC = () => (
  <div style={{
    background: '#0b192e',
    border: '1px solid rgba(35,194,123,0.15)',
    borderRadius: 16,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    height: '100%',
  }}>
    {/* Badges */}
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ ...shimmerStyle, width: 64, height: 20 }} />
      <div style={{ ...shimmerStyle, width: 100, height: 20 }} />
    </div>

    {/* Title */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ ...shimmerStyle, width: '90%', height: 16 }} />
      <div style={{ ...shimmerStyle, width: '65%', height: 16 }} />
    </div>

    {/* Divider */}
    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

    {/* Info row */}
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ ...shimmerStyle, width: 70, height: 14 }} />
      <div style={{ ...shimmerStyle, width: 80, height: 14 }} />
      <div style={{ ...shimmerStyle, width: 60, height: 14 }} />
    </div>

    {/* CTA */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
      <div style={{ ...shimmerStyle, width: 130, height: 32, borderRadius: 8 }} />
      <div style={{ ...shimmerStyle, width: 72, height: 14 }} />
    </div>

    <style>{`
      @keyframes skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div style={{
    background: '#0b192e',
    border: '1px solid rgba(35,194,123,0.15)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 12,
  }}>
    {/* Header row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ ...shimmerStyle, width: '280px', height: 18 }} />
        <div style={{ ...shimmerStyle, width: 70, height: 20, borderRadius: 9999 }} />
      </div>
      <div style={{ ...shimmerStyle, width: 90, height: 14 }} />
    </div>

    {/* Meta */}
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ ...shimmerStyle, width: 120, height: 13 }} />
      <div style={{ ...shimmerStyle, width: 100, height: 13 }} />
    </div>

    {/* Actions */}
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <div style={{ ...shimmerStyle, width: 90, height: 32, borderRadius: 8 }} />
      <div style={{ ...shimmerStyle, width: 100, height: 32, borderRadius: 8 }} />
    </div>

    <style>{`
      @keyframes skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);
