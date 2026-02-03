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
    <div className={`bg-card text-card-foreground rounded-[1.5rem] shadow-sm border border-border/50 mb-4 overflow-hidden transition-all duration-300 ${className}`}>
      {(title || action) && (
        <div className="px-5 pt-5 pb-2 flex justify-between items-start">
          <div>
            {title && <h3 className="text-[17px] font-semibold tracking-tight leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
};

export default Card;