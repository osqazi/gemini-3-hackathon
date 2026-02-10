'use client';

import { motion } from 'framer-motion';
import { Message } from '@/types'; // Import Message type from main types file

interface MessageAnimationProps {
  children: React.ReactNode;
  index: number;
  isVisible?: boolean;
}

export const MessageAnimation = ({ children, index, isVisible = true }: MessageAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        delay: index * 0.05, // Stagger the animation slightly
      }}
      exit={{ opacity: 0, y: -10 }}
    >
      {children}
    </motion.div>
  );
};

interface MessageContainerProps {
  children: React.ReactNode;
  role: 'user' | 'assistant';
  animate?: boolean;
}

export const AnimatedMessageContainer = ({ children, role, animate = true }: MessageContainerProps) => {
  if (!animate) {
    return <div className={`message-container ${role}`}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`message-container ${role}`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.05
        }}
        className="message-content"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
}

export const StaggeredList = ({ children, className = '' }: StaggeredListProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 20 },
          }}
          className="mb-2"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};