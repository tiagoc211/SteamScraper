import React from 'react';
import './RadialMenu.css';

// Função para calcular as coordenadas de um ponto num círculo
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
      <svg className="radial-menu-svg" viewBox="-1.2 -1.2 2.4 2.4">
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
          
          // LÓGICA DE INVERSÃO: Verifica se a fatia está no lado esquerdo
          const isFlipped = textAngle > 90 && textAngle < 270;

          return (
            <g
              key={item.key}
              className={`radial-menu-slice-group ${item.disabled ? 'disabled' : ''}`}
              onClick={() => !item.disabled && onSelect(item.key)}
              onMouseEnter={() => onHover && onHover(item.key)}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <path className="slice-path" d={pathData} />
              <text
                className="slice-text"
                // Aplica a classe 'flipped' se necessário
                transform={`rotate(${textAngle})`}
              >
                <tspan 
                    x={isFlipped ? "-0.65" : "0.65"} 
                    dy="0.03em" 
                    // Roda 180 graus no lado esquerdo para não ficar invertido
                    transform={`rotate(${isFlipped ? -90 : 90})`}
                >
                    {item.label}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RadialMenu;