'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  pulseOnHover?: boolean;
  scaleOnHover?: boolean;
  disabled?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    children,
    className,
    isLoading = false,
    loadingText = "Loading...",
    pulseOnHover = false,
    scaleOnHover = true,
    disabled,
    ...props
  }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "relative overflow-hidden",
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center justify-center"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-transparent">{loadingText}</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated background effect */}
        <motion.div
          className="absolute inset-0 bg-primary/10"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ originX: 'left' }}
        />

        {/* Pulse effect on hover */}
        {pulseOnHover && (
          <motion.span
            className="absolute -z-10 inline-flex h-full w-full animate-ping rounded-full bg-primary/30"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// Wrapper for the original button with animations
const AnimatedButtonWrapper = motion(AnimatedButton);

interface AnimatedButtonWithMotionProps extends AnimatedButtonProps {
  animateOnHover?: boolean;
}

export const AnimatedButtonWithEffects = ({
  children,
  className,
  isLoading = false,
  loadingText = "Loading...",
  pulseOnHover = false,
  scaleOnHover = true,
  animateOnHover = true,
  disabled,
  ...props
}: AnimatedButtonWithMotionProps) => {
  const motionProps = animateOnHover
    ? {
        whileHover: scaleOnHover
          ? { scale: 1.03, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }
          : { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <AnimatedButtonWrapper
      className={className}
      isLoading={isLoading}
      loadingText={loadingText}
      pulseOnHover={pulseOnHover}
      disabled={disabled}
      {...motionProps}
      {...props}
    >
      {children}
    </AnimatedButtonWrapper>
  );
};

// Specialized loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

export const LoadingSpinner = ({ size = 'md', className, pulse = true }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      animate={pulse ? {
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7]
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
    </motion.div>
  );
};

// Animated pulse background for loading states
interface PulseBackgroundProps {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export const PulseBackground = ({ children, isActive = true, className }: PulseBackgroundProps) => {
  if (!isActive) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        background: [
          "radial-gradient(circle, transparent 20%, var(--primary) 20%, var(--primary) 80%, transparent 80%)",
          "radial-gradient(circle, transparent 20%, var(--primary)/30% 20%, var(--primary)/30% 80%, transparent 80%)",
          "radial-gradient(circle, transparent 20%, var(--primary) 20%, var(--primary) 80%, transparent 80%)",
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

export { AnimatedButton };