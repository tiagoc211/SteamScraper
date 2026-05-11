import React from 'react';
import './Seagulls.css';

/**
 * Animated 2D seagull silhouettes — SVG curved wings.
 * Follows a descending arc from right to left across the viewport.
 */
const Seagull = ({ size }) => (
  <svg
    className="seagull-svg"
    width={size * 2.4}
    height={size * 0.9}
    viewBox="0 0 120 45"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left wing */}
    <g className="wing-svg-left" style={{ transformOrigin: '60px 32px' }}>
      <path
        d="M60,32 C48,30 25,10 2,20"
        stroke="rgba(180,210,240,0.6)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </g>
    {/* Right wing — mirror */}
    <g className="wing-svg-right" style={{ transformOrigin: '60px 32px' }}>
      <path
        d="M60,32 C72,30 95,10 118,20"
        stroke="rgba(180,210,240,0.6)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
);

const BIRDS = [
  { id: 1, size: 18, topPct: '10%', delay: '0s',  duration: '26s', flapSpeed: '1.1s'  },
  { id: 2, size: 14, topPct: '30%', delay: '5s',  duration: '30s', flapSpeed: '1.0s'  },
  { id: 3, size: 11, topPct: '60%', delay: '11s', duration: '34s', flapSpeed: '1.2s'  },
  { id: 4, size: 20, topPct: '20%', delay: '16s', duration: '24s', flapSpeed: '1.05s' },
  { id: 5, size: 10, topPct: '75%', delay: '22s', duration: '36s', flapSpeed: '1.3s'  },
  { id: 6, size: 15, topPct: '45%', delay: '8s',  duration: '28s', flapSpeed: '1.08s' },
  { id: 7, size: 12, topPct: '5%',  delay: '19s', duration: '25s', flapSpeed: '1.15s' },
  { id: 8, size: 9,  topPct: '85%', delay: '28s', duration: '38s', flapSpeed: '1.25s' },
];

const Seagulls = () => (
  <div className="seagulls-container" aria-hidden="true">
    {BIRDS.map((bird) => (
      <div
        key={bird.id}
        className="seagull-path"
        style={{
          top: bird.topPct,
          animationDuration: bird.duration,
          animationDelay: bird.delay,
        }}
      >
        <div
          className="seagull-body"
          style={{ '--flap-speed': bird.flapSpeed }}
        >
          <Seagull size={bird.size} />
        </div>
      </div>
    ))}
  </div>
);

export default Seagulls;

