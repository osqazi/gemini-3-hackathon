'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React, { TouchEvent, MouseEvent, useState, ReactNode } from 'react';

interface TouchFriendlyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

export const TouchFriendlyButton = ({
  children,
  onClick,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  onTouchStart,
  onTouchEnd,
}: TouchFriendlyButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
    if (onTouchStart) onTouchStart();
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (onTouchEnd) onTouchEnd();
    if (onClick) onClick();
  };

  // Size classes for touch targets
  const sizeClasses = {
    default: 'h-10 px-4 py-2 text-base rounded-md min-h-[44px]',
    sm: 'h-9 px-3 text-sm rounded-md min-h-[40px]',
    lg: 'h-11 px-8 text-lg rounded-md min-h-[48px]',
    icon: 'h-10 w-10 rounded-md min-h-[44px] min-w-[44px]'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
    ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
    link: 'underline-offset-4 hover:underline text-primary active:scale-[0.98]'
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        variantClasses[variant],
        'select-none touch-manipulation', // Additional touch-friendly styles
        className
      )}
      disabled={disabled}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileTap={{ scale: 0.95 }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      style={{
        // Ensure minimum touch target size of 44px
        minHeight: '44px',
        minWidth: '44px',
      }}
    >
      {children}
    </motion.button>
  );
};

interface TouchFriendlyCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TouchFriendlyCard = ({ children, className, onClick }: TouchFriendlyCardProps) => {
  return (
    <motion.div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow transition-colors',
        'cursor-pointer select-none touch-manipulation',
        className
      )}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      style={{
        minHeight: '88px', // Minimum height for touch targets
      }}
    >
      {children}
    </motion.div>
  );
};

interface SwipeableContainerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export const SwipeableContainer = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className
}: SwipeableContainerProps) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    const diffX = touchEnd.x - touchStart.x;
    const diffY = touchEnd.y - touchStart.y;

    // Minimum swipe distance threshold
    if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (diffX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (diffY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (diffY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
      setTouchStart(null); // Reset after swipe
    }
  };

  return (
    <div
      className={cn('touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: ReactNode[];
  minColumnWidth?: string;
  gap?: string;
  className?: string;
}

export const ResponsiveGrid = ({
  children,
  minColumnWidth = '280px',
  gap = 'gap-4',
  className = ''
}: ResponsiveGridProps) => {
  return (
    <div
      className={cn(
        'grid',
        'auto-rows-min', // Rows adapt to content height
        gap,
        'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        '[&>*]:min-h-[120px]', // Minimum height for touch targets
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

// Hook to detect touch device
export const useIsTouchDevice = () => {
  if (typeof window === 'undefined') return false;

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Component to render different UI for touch vs mouse
interface TouchAwareComponentProps {
  touchComponent: ReactNode;
  mouseComponent?: ReactNode;
  children?: ReactNode;
}

export const TouchAwareComponent = ({
  touchComponent,
  mouseComponent,
  children
}: TouchAwareComponentProps) => {
  const isTouch = useIsTouchDevice();

  if (isTouch) {
    return <>{touchComponent}</>;
  }

  return mouseComponent || <>{children}</>;
};

// Touch-friendly slider component
interface TouchSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const TouchSlider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className
}: TouchSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const handleTouchMove = (e: TouchEvent | MouseEvent) => {
    if (!sliderRef.current || !isDragging) return;

    const rect = sliderRef.current.getBoundingClientRect();
    let clientX;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round(((max - min) * position + min) / step) * step;

    onChange(Math.min(max, Math.max(min, newValue)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove as any);
      window.addEventListener('mousemove', handleTouchMove as any);
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('mouseup', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove as any);
      window.removeEventListener('mousemove', handleTouchMove as any);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mouseup', handleTouchEnd);
    };
  }, [isDragging]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={sliderRef}
      className={cn('relative h-4 w-full cursor-pointer touch-none', className)}
      onTouchStart={() => setIsDragging(true)}
      onMouseDown={() => setIsDragging(true)}
    >
      <div className="absolute h-2 w-full rounded-full bg-secondary" />
      <div
        className="absolute h-2 rounded-full bg-primary"
        style={{ width: `${percentage}%` }}
      />
      <motion.div
        className="absolute -top-2 -ml-2 h-6 w-6 rounded-full bg-primary"
        style={{ left: `${percentage}%` }}
        whileTap={{ scale: 1.2 }}
      />
    </div>
  );
};