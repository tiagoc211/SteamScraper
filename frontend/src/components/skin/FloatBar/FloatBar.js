import React from 'react';
import HoverTooltip from '../../ui/HoverTooltip/HoverTooltip';
import './FloatBar.css';

const FloatBar = ({ floatValue, paintSeed }) => {
  const floatPercent = (floatValue || 0) * 100;
  const formattedFloat = (floatValue || 0).toFixed(12);

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
        <div className="indicator" style={{ left: `${floatPercent}%` }} />
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
          <span className="paint-seed">{paintSeed}</span>
        </HoverTooltip>
      </div>
    </div>
  );
};

export default FloatBar;