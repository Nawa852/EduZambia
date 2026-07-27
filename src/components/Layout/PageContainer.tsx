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
  <div className={cn('w-full max-w-[1280px] mx-auto space-y-4 sm:space-y-5', className)}>
    {children}
  </div>
);

export default PageContainer;
