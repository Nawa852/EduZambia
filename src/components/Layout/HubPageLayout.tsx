import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabFromUrl } from '@/hooks/useTabFromUrl';
import { HubSkeleton } from '@/components/UI/HubSkeleton';
import { InlineErrorBoundary } from '@/components/UI/ErrorState';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';


export interface HubTab {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
  badge?: string;
}

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface HubPageLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tabs: HubTab[];
  defaultTab: string;
  accentColor?: string;
  quickLinks?: QuickLink[];
}

const Loader = () => <HubSkeleton />;

export const HubPageLayout: React.FC<HubPageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  tabs,
  defaultTab,
  quickLinks,
}) => {
  const [tab, setTab] = useTabFromUrl(defaultTab);

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1280px] mx-auto px-2 sm:px-0">
      {/* Hero header — tinted card, Apple-style */}
      <div className="relative overflow-hidden rounded-[20px] bg-primary/[0.07] dark:bg-primary/[0.12] border border-primary/10">
        <div className="relative px-3.5 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-primary/12 text-primary ring-1 ring-primary/15">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] sm:text-xl font-semibold text-foreground leading-tight tracking-[-0.02em]">{title}</h1>
              <p className="text-[12.5px] sm:text-[13px] text-muted-foreground mt-1 leading-snug sm:max-w-lg">{subtitle}</p>
            </div>
          </div>
          {quickLinks && quickLinks.length > 0 && (
            <div className="flex sm:flex-wrap gap-2 -mx-3.5 sm:mx-0 px-3.5 sm:px-0 overflow-x-auto scrollbar-none">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 hover:bg-card text-[12px] font-medium text-foreground transition-colors border border-border/50 whitespace-nowrap shrink-0"
                >
                  <link.icon className="w-3.5 h-3.5 text-primary" />
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs — segmented control with underline indicator */}
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-3 sm:space-y-4">
        <div className="sticky top-0 sm:top-2 z-30 -mx-2 sm:mx-0 px-2 sm:px-0">
          <div className="rounded-none sm:rounded-[16px] border-y sm:border border-border/40 bg-background/85 supports-[backdrop-filter]:bg-background/70 backdrop-blur-xl px-1 py-1">
            <TabsList className="w-full justify-start gap-0.5 bg-transparent h-auto p-0 overflow-x-auto scrollbar-none scroll-smooth snap-x">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={cn(
                    "relative snap-start gap-1.5 px-3.5 sm:px-4 py-2 rounded-[12px] text-[12.5px] sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0",
                    "data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-semibold",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                    "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-full after:bg-primary after:transition-all after:w-0 data-[state=active]:after:w-5"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary text-primary-foreground leading-none">
                      {t.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>


        <div>
          <InlineErrorBoundary label="This tab hit an error">
            <Suspense fallback={<Loader />}>
              {tabs.map((t) => (
                <TabsContent
                  key={t.id}
                  value={t.id}
                  className="mt-0 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200"
                >
                  <t.component />
                </TabsContent>
              ))}
            </Suspense>
          </InlineErrorBoundary>
        </div>
      </Tabs>
    </div>
  );
};
