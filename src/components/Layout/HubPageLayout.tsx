import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabFromUrl } from '@/hooks/useTabFromUrl';
import { HubSkeleton } from '@/components/UI/HubSkeleton';
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
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm surface-tinted">
        <div className="relative px-3 py-3 sm:px-4 sm:py-4 lg:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary ring-1 ring-primary/10 shadow-sm">
              <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-tight tracking-tight truncate">{title}</h1>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 sm:line-clamp-none sm:max-w-md">{subtitle}</p>
            </div>
          </div>
          {quickLinks && quickLinks.length > 0 && (
            <div className="flex sm:flex-wrap gap-2 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-none">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-[11px] sm:text-xs font-medium text-secondary-foreground transition-all hover:-translate-y-0.5 border border-border/40 whitespace-nowrap shrink-0"
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="rounded-2xl border border-border/40 bg-card px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-sm">
          <TabsList className="w-full justify-start gap-1 bg-transparent h-auto p-0 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className={cn(
                   "relative gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs lg:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0",
                  "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-semibold",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-secondary/40 data-[state=inactive]:hover:text-foreground"
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

        <div>
          <Suspense fallback={<Loader />}>
            {tabs.map((t) => (
              <TabsContent key={t.id} value={t.id} className="mt-0 focus-visible:outline-none">
                <t.component />
              </TabsContent>
            ))}
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
};
