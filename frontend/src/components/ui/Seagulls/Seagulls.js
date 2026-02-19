import React from 'react';
import './Seagulls.css';

/**
 * Animated 2D seagull silhouettes flying across the viewport.
 * Each seagull is a pure-CSS bird shape (two wing arcs) with a
 * flapping keyframe and a horizontal drift path.
 */
const BIRDS = [
  { id: 1, size: 28, top: '8%',  delay: '0s',    duration: '18s', flapSpeed: '0.8s',  y: -30 },
  { id: 2, size: 22, top: '5%',  delay: '2s',    duration: '22s', flapSpeed: '0.7s',  y: -15 },
  { id: 3, size: 18, top: '14%', delay: '5s',    duration: '25s', flapSpeed: '0.9s',  y: -40 },
  { id: 4, size: 32, top: '4%',  delay: '8s',    duration: '20s', flapSpeed: '0.75s', y: -20 },
  { id: 5, size: 15, top: '18%', delay: '12s',   duration: '28s', flapSpeed: '0.85s', y: -50 },
  { id: 6, size: 24, top: '10%', delay: '4s',    duration: '24s', flapSpeed: '0.7s',  y: -25 },
  { id: 7, size: 20, top: '6%',  delay: '15s',   duration: '21s', flapSpeed: '0.8s',  y: -35 },
  { id: 8, size: 16, top: '12%', delay: '10s',   duration: '26s', flapSpeed: '0.9s',  y: -45 },
];

const Seagulls = () => (
  <div className="seagulls-container" aria-hidden="true">
    {BIRDS.map((bird) => (
      <div
        key={bird.id}
        className="seagull-path"
        style={{
          top: bird.top,
          animationDuration: bird.duration,
          animationDelay: bird.delay,
          '--bird-y-drift': `${bird.y}px`,
        }}
      >
        <div
          className="seagull"
          style={{
            '--wing-size': `${bird.size}px`,
            animationDuration: bird.flapSpeed,
          }}
        >
          <div className="wing wing-left" />
          <div className="wing wing-right" />
        </div>
      </div>
    ))}
  </div>
);

export default Seagulls;
