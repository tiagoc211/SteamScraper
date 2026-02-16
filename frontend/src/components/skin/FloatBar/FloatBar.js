import React from 'react';
import HoverTooltip from '../../ui/HoverTooltip/HoverTooltip';
import './FloatBar.css';

const FloatBar = ({ floatValue, paintSeed }) => {
  // Se não tiver float ou paint seed, retorna uma versão simplificada
  const hasFloatData = floatValue != null && floatValue > 0;
  
  const floatPercent = hasFloatData ? floatValue * 100 : 0;
  const formattedFloat = hasFloatData ? floatValue.toFixed(12) : 'N/A';
  const displayPaintSeed = paintSeed != null ? paintSeed : 'N/A';

  const floatTooltipLines = [
    "Controls how much wear the skin has and ranges from 0-1",
  ];

  const seedTooltipLines = [
    "Controls the texture placement of the skin and ranges from 0-1000"
  ];

  return (
    <div className="float-bar-container">
      <div className="bar-wrapper">
        <div className="bar-background" />
        {hasFloatData && <div className="indicator" style={{ left: `${floatPercent}%` }} />}
      </div>
      <div className="values-wrapper">
        <HoverTooltip 
          title="Float Value" 
          lines={floatTooltipLines}
          position="bottom"
        >
          <span className="float-value">{formattedFloat}</span>
        </HoverTooltip>
        <HoverTooltip 
          title="Paint Seed" 
          lines={seedTooltipLines}
          position="bottom"
        >
          <span className="paint-seed">{displayPaintSeed}</span>
        </HoverTooltip>
      </div>
    </div>
  );
};

export default FloatBar;