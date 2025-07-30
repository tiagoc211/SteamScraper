import React from 'react';
import { motion } from 'framer-motion';
import './RadialMenu.css';

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const RadialMenu = ({ title, items, onSelect, onHover }) => {
  const sliceCount = items.length;
  if (sliceCount === 0) return null;

  const slicePercent = 1 / sliceCount;

  return (
    <div className="radial-menu-container">
      <div className="radial-menu-center">{title}</div>
      <motion.svg
        className="radial-menu-svg"
        viewBox="-1.2 -1.2 2.4 2.4"
        initial="hidden"
        animate="visible"
      >
      
        {items.map((item, index) => {
          const startPercent = slicePercent * index;
          const endPercent = slicePercent * (index + 1);

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          const textAngle = (startPercent + slicePercent / 2) * 360;

          return (
            <motion.g
              key={item.key}
              className={`radial-menu-slice-group ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && onSelect(item.key)}
              onMouseEnter={() => onHover?.(item.key)}
              onMouseLeave={() => onHover?.(null)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{
                scale: 1.08,
                rotateX: -4,
                rotateY: 4,
                z: 10,
              }}
              transition={{
                delay: index * 0.05,
                duration: 0.4,
                ease: 'easeOut',
                type: 'spring',
                stiffness: 150,
              }}
            >
              <path className="slice-path" d={pathData} />
              <text
                className="slice-text"
                transform={`rotate(${textAngle})`}
              >
                <tspan x="0.65" dy="0.03em" transform="rotate(90)">
                  {item.label}
                </tspan>
              </text>
            </motion.g>
          );
        })}
      </motion.svg>
    </div>
  );
};

export default RadialMenu;
