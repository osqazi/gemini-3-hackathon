'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ThemeImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  animateOnLoad?: boolean;
}

export const ThemeImage = ({
  src,
  alt,
  className,
  priority = false,
  fill = false,
  width,
  height,
  placeholder = 'empty',
  blurDataURL,
  animateOnLoad = true
}: ThemeImageProps) => {
  if (fill) {
    // When fill is used, we must wrap in a container with relative positioning
    if (animateOnLoad) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full h-full"
        >
          <Image
            src={src}
            alt={alt}
            className={cn(className)}
            priority={priority}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            sizes="100vw"  /* Always add sizes when fill is used */
          />
        </motion.div>
      );
    } else {
      return (
        <div className="relative w-full h-full">
          <Image
            src={src}
            alt={alt}
            className={cn(className)}
            priority={priority}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            sizes="100vw"  /* Always add sizes when fill is used */
          />
        </div>
      );
    }
  } else {
    // When fill is not used, return directly
    if (animateOnLoad) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Image
            src={src}
            alt={alt}
            className={cn(className)}
            priority={priority}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
          />
        </motion.div>
      );
    } else {
      return (
        <Image
          src={src}
          alt={alt}
          className={cn(className)}
          priority={priority}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
        />
      );
    }
  }
};

interface HeroBackgroundProps {
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export const HeroBackground = ({
  src = '/images/hero-background.jpg',
  alt = 'App hero background',
  className = '',
  children
}: HeroBackgroundProps) => {
  return (
    <div className={cn('relative w-full h-[600px] overflow-hidden rounded-xl border-4 border-orange-400/30 shadow-2xl shadow-orange-500/20', className)}>
      {/* Background image - use regular img tag to bypass Next.js optimization cache */}
      <div className="absolute inset-0">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
};

interface CardBackgroundImageProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
  className?: string;
}

export const CardBackgroundImage = ({
  src,
  alt,
  children,
  className = ''
}: CardBackgroundImageProps) => {
  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      <ThemeImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        animateOnLoad={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent" />
      <div className="relative p-4">
        {children}
      </div>
    </div>
  );
};

interface AvatarPlaceholderProps {
  initials?: string;
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarPlaceholder = ({
  initials = 'U',
  src,
  alt = 'Avatar',
  size = 'md',
  className = ''
}: AvatarPlaceholderProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  if (src) {
    return (
      <ThemeImage
        src={src}
        alt={alt}
        width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
        height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
        animateOnLoad={true}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold',
      sizeClasses[size],
      className
    )}>
      {initials.charAt(0).toUpperCase()}
    </div>
  );
};

interface IngredientGridProps {
  images?: string[];
  className?: string;
}

export const IngredientGrid = ({ images = [], className = '' }: IngredientGridProps) => {
  // Default images if none provided - removing avatar-placeholder.jpg as it's not used for ingredients
  const availableImages = [
    '/images/vegetables.jpg',
    '/images/fruits.jpg',
    '/images/proteins.jpg',
    '/images/grains.jpg',
    '/images/dairy.jpg',
    '/images/herbs-spices.jpg'
  ];

  const displayImages = images.length > 0 ? images : availableImages;

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 xl:gap-14 lg:gap-14 sm:gap-10 gap-6 ', className)}> {/* Fewer columns at lg to make images larger, balanced xl columns */}
      {displayImages.map((imgSrc, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="aspect-square rounded-xl overflow-hidden relative bg-gradient-to-br from-orange-100 to-red-100 border border-orange-200 flex items-center justify-center lg:scale-120 xl:scale-120"  /* 20% larger only on large screens (1024px+) and extra-large screens */
        >
          <div className="absolute inset-0 lg:scale-120 xl:scale-120">
            <ThemeImage
              src={imgSrc}
              alt={`Ingredient ${imgSrc.split('/').pop()?.replace('.jpg', '').replace('.jpeg', '').replace('.png', '') || `Ingredient ${index + 1}`}`}
              fill
              className="object-cover object-center"  /* Normal size with responsive scaling */
              priority={index < 4}
            />
          </div>
          {/* Removed text overlay to fix the alt text issue */}
        </motion.div>
      ))}
    </div>
  );
};

interface KitchenScenesBackgroundProps {
  className?: string;
}

export const PageBackground = ({ className = '' }: KitchenScenesBackgroundProps) => {
  return (
    <div
      className={cn('fixed inset-0 w-full h-screen', className)}
      style={{
        backgroundImage: `url('/images/ingredients-grid.jpg')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '900px',  /* Reduced by 25% from 1200px to 900px */
        opacity: 0.08,  /* Reduced opacity to be more subtle against dark background */
        pointerEvents: 'none',
        backgroundPosition: 'top left',
        backgroundAttachment: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        filter: 'contrast(1.3) brightness(1.1) saturate(1.1)',  /* Enhance contrast and brightness for dark background */
      }}
    />
  );
};

export const KitchenScenesBackground = ({ className = '' }: KitchenScenesBackgroundProps) => {
  return (
    <div className={cn('absolute inset-0 -z-10 overflow-hidden', className)}>
      <div className="absolute inset-0">
        <ThemeImage
          src="/images/cozy-kitchen.jpg"
          alt="Cozy kitchen background"
          fill
          className="object-cover opacity-20"
          priority={false}
        />
      </div>
    </div>
  );
};