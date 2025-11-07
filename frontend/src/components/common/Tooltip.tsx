import { ReactNode } from 'react';
import './Tooltip.css';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip = ({ text, children, position = 'top' }: TooltipProps) => {
  return (
    <div className="tooltip-wrapper">
      {children}
      <span className={`tooltip tooltip-${position}`}>{text}</span>
    </div>
  );
};

export default Tooltip;


