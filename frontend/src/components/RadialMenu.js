import React from 'react';
import './RadialMenu.css';

// Função para calcular as coordenadas de um ponto num círculo (para o caminho SVG)
const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const RadialMenu = ({ title, items, onSelect, onHover }) => {
  const sliceCount = items.length;
  if (sliceCount === 0) return null; // Não renderiza nada se não houver itens

  const slicePercent = 1 / sliceCount;

  return (
    <div className="radial-menu-container">
      <div className="radial-menu-center">{title}</div>
      <svg className="radial-menu-svg" viewBox="-1.2 -1.2 2.4 2.4">
        {items.map((item, index) => {
          const startPercent = slicePercent * index;
          const endPercent = slicePercent * (index + 1);

          // Coordenadas para o arco da fatia
          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);

          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

          // Caminho SVG para a fatia
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          // Ângulo para o texto, ajustado para começar no topo e ir no sentido horário
          const textAngle = (startPercent + slicePercent / 2) * 360;

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
                transform={`rotate(${textAngle})`} // Roda o sistema de coordenadas do texto
              >
                {/* tspan permite mais controlo sobre o posicionamento e rotação do texto */}
                <tspan x="0.65" dy="0.03em" transform="rotate(90)">{item.label}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RadialMenu;