import React from 'react';
import logoImg from '../assets/logo.png';

/**
 * Reusable Application Logo Component
 * Displays the 3D wallet & financial growth logo with responsive sizing.
 */
export const Logo = ({ size = 'md', className = '', alt = 'AI Expense Analyzer Logo' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <img
      src={logoImg}
      alt={alt}
      className={`object-contain flex-shrink-0 select-none ${selectedSize} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

export default Logo;
