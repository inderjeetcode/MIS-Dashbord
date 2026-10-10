import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'black';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#F5E642] text-[#171717] hover:bg-[#ebd926]', // Yellow
    secondary: 'bg-white text-[#171717] hover:bg-[#f2efe9]',
    accent: 'bg-[#5278FF] text-white hover:bg-[#3e66f5]', // Blue
    danger: 'bg-[#FF715B] text-white hover:bg-[#f05a42]', // Coral
    black: 'bg-[#171717] text-white hover:bg-[#2b2b2b]',
    ghost: 'bg-transparent text-[#171717] hover:bg-[#EFECE6] border-none shadow-none active:translate-x-0 active:translate-y-0',
  }[variant];

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs font-semibold',
    md: 'px-4 py-2 text-sm font-bold',
    lg: 'px-6 py-3 text-base font-extrabold',
  }[size];

  const borderAndShadow =
    variant === 'ghost'
      ? ''
      : 'border-2 border-[#171717] shadow-[3px_3px_0px_#171717] active:shadow-[1px_1px_0px_#171717] active:translate-x-[2px] active:translate-y-[2px]';

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        uppercase tracking-wider rounded-none
        transition-all duration-75 select-none
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0
        ${borderAndShadow}
        ${variantStyles}
        ${sizeStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
