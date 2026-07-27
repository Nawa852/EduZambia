import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Single iOS-style page container used by every route.
 * Consistent max width, gutters, vertical rhythm and safe-area padding.
 */
export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      // Scales with the device: comfortable on phones, genuinely wide on large screens.
      'w-full mx-auto space-y-4 sm:space-y-5',
      'max-w-[720px] md:max-w-[1024px] lg:max-w-[1320px] xl:max-w-[1560px] 2xl:max-w-[1760px]',
      className,
    )}
  >
    {children}
  </div>

);

export default PageContainer;
