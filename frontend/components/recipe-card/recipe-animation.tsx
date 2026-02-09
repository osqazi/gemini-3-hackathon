'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RecipeCardProps } from './recipe-card'; // Assuming this is the interface for the recipe card
import RecipeCard from './recipe-card';

interface RecipeCardAnimationProps {
  recipe: RecipeCardProps;
  isVisible: boolean;
  index?: number;
}

export const RecipeCardReveal = ({ recipe, isVisible, index = 0 }: RecipeCardAnimationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
            y: 50,
            rotateX: -90
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20,
            rotateX: 90
          }}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
            delay: index * 0.1, // Stagger multiple recipes if needed
          }}
          layout
          className="recipe-card-container"
        >
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="recipe-card-wrapper"
          >
            <RecipeCard {...recipe} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface RecipeSlideUpProps {
  children: React.ReactNode;
  delay?: number;
}

export const RecipeSlideUp = ({ children, delay = 0 }: RecipeSlideUpProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay
      }}
      exit={{ opacity: 0, y: 20 }}
    >
      {children}
    </motion.div>
  );
};

interface RecipeFadeInProps {
  children: React.ReactNode;
  delay?: number;
}

export const RecipeFadeIn = ({ children, delay = 0 }: RecipeFadeInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: "easeInOut",
        delay
      }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedRecipeListProps {
  recipes: RecipeCardProps[];
  className?: string;
}

export const AnimatedRecipeList = ({ recipes, className = '' }: AnimatedRecipeListProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {recipes.map((recipe, index) => (
        <motion.div
          key={recipe.id || index}
          variants={{
            visible: { opacity: 1, y: 0, scale: 1 },
            hidden: { opacity: 0, y: 20, scale: 0.95 },
          }}
          className="mb-6"
        >
          <RecipeCardReveal recipe={recipe} isVisible={true} index={index} />
        </motion.div>
      ))}
    </motion.div>
  );
};