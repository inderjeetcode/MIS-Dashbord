import React from 'react';

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'yellow' | 'blue' | 'coral' | 'neutral';
  shadowSize?: 'sm' | 'md' | 'lg' | 'none';
  hasBorder?: boolean;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  className = '',
  variant = 'white',
  shadowSize = 'md',
  hasBorder = true,
}) => {
  const bgStyles = {
    white: 'bg-white',
    yellow: 'bg-[#F5E642]',
    blue: 'bg-[#5278FF] text-white',
    coral: 'bg-[#FF715B] text-white',
    neutral: 'bg-[#EFECE6]',
  }[variant];

  const shadowStyles = {
    none: '',
    sm: 'shadow-[2px_2px_0px_#171717]',
    md: 'shadow-[4px_4px_0px_#171717]',
    lg: 'shadow-[6px_6px_0px_#171717]',
  }[shadowSize];

  return (
    <div
      className={`
        ${bgStyles}
        ${hasBorder ? 'border-2 border-[#171717]' : ''}
        ${shadowStyles}
        rounded-none transition-all
        ${className}
      `}
    >
      {children}
    </div>
  );
};
