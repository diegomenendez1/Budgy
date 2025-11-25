import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle,
  action,
  noPadding = false 
}) => {
  return (
    <div className={`bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/50 mb-5 overflow-hidden transition-all duration-300 ${className}`}>
      {(title || action) && (
        <div className="px-6 pt-5 pb-2 flex justify-between items-start">
          <div>
            {title && <h3 className="text-[17px] font-bold text-gray-900 leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;