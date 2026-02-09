'use client';

import React, { useState, useEffect } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface PreferencesToggleProps {
  onToggle: (enabled: boolean) => void;
  initialEnabled?: boolean;
}

const PreferencesToggle: React.FC<PreferencesToggleProps> = ({
  onToggle,
  initialEnabled = true
}) => {
  const { data: session, status } = useSession();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);

  // Only show for signed-in users
  const isSignedIn = status === 'authenticated';

  useEffect(() => {
    if (isSignedIn) {
      setIsEnabled(initialEnabled);
      onToggle(initialEnabled);
    }
  }, [isSignedIn, initialEnabled, onToggle]);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    onToggle(newValue);
  };

  if (!isSignedIn) {
    return null; // Don't render for non-signed-in users
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="preferences-toggle" className="text-sm font-medium">
        Include Preferences
      </Label>
      <TogglePrimitive.Root
        id="preferences-toggle"
        pressed={isEnabled}
        onPressedChange={handleToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isEnabled ? 'bg-primary' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </TogglePrimitive.Root>
    </div>
  );
};

export default PreferencesToggle;