import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './HoverTooltip.css';

const HoverTooltip = ({ children, title, imageUrl, lines, mouseMoveNonce, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapperRef = useRef(null);

  const updatePosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPos({
        // Se a posição for 'bottom', o tooltip ancora-se à parte de baixo do elemento
        top: position === 'bottom' ? rect.bottom : rect.top,
        left: rect.left + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, mouseMoveNonce]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && pos && ReactDOM.createPortal(
        <div 
          className={`tooltip-content tooltip-${position}`}
          style={{ top: pos.top, left: pos.left }}
        >
          {title && <h4 className="tooltip-title">{title}</h4>}
          {imageUrl && <img src={imageUrl} alt={title || 'Tooltip preview'} className="tooltip-image" />}
          {lines && (
            <div className="tooltip-lines">
              {lines.map((line, index) => <p key={index}>{line}</p>)}
            </div>
          )}
        </div>,
        document.getElementById('tooltip-root')
      )}
    </div>
  );
};

export default HoverTooltip;