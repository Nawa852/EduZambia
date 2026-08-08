import React, { Suspense, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTabFromUrl } from '@/hooks/useTabFromUrl';
import { useProfile } from '@/hooks/useProfile';
import { isStudentNavVisible, isTabVisibleForRole } from '@/config/studentFeatures';
import { HubSkeleton } from '@/components/UI/HubSkeleton';
import { InlineErrorBoundary } from '@/components/UI/ErrorState';
import { ToolSheet } from '@/components/UI/ToolSheet';
import { ToolGrid } from '@/components/UI/ToolGrid';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface HubTab {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
  badge?: string;
  description?: string;
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
  tabs: allTabs,
  defaultTab,
  quickLinks: allQuickLinks,
}) => {
  const [tab, setTab] = useTabFromUrl(defaultTab);
  const { pathname } = useLocation();
  const { profile } = useProfile();
  const role = (profile?.role as string) || 'student';

  // Paused features never render a tab or a shortcut for students.
  const tabs = useMemo(
    () => allTabs.filter((t) => isTabVisibleForRole(role, pathname, t.id)),
    [allTabs, role, pathname],
  );
  const quickLinks = useMemo(
    () => (allQuickLinks ?? []).filter((l) => role !== 'student' || isStudentNavVisible(l.href)),
    [allQuickLinks, role],
  );

  const homeTab = tabs.find((t) => t.id === defaultTab) ?? tabs[0];
  const toolTabs = tabs.filter((t) => t.id !== homeTab?.id);
  const activeTool = toolTabs.find((t) => t.id === tab) ?? null;

  const closeTool = useCallback(() => setTab(homeTab.id), [setTab, homeTab.id]);

  const HomeComponent = homeTab?.component;
  const ActiveComponent = activeTool?.component;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero header — plain iOS large-title, no heavy chrome */}
      <header className="px-0.5 pt-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-[12px] bg-primary/10 text-primary">
            <Icon className="w-[18px] h-[18px]" />
          </span>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-foreground leading-tight tracking-[-0.025em] truncate">
            {title}
          </h1>
        </div>
        <p className="text-[12.5px] sm:text-[13px] text-muted-foreground mt-1.5 leading-snug max-w-xl line-clamp-2">
          {subtitle}
        </p>
        {quickLinks && quickLinks.length > 0 && (
          <div className="flex gap-2 mt-3 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
            {quickLinks.slice(0, 4).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary text-[12px] font-medium text-foreground transition-colors whitespace-nowrap shrink-0"
              >
                <link.icon className="w-3.5 h-3.5 text-primary" />
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>


      {/* Segmented quick-switcher — opens tools as sheets */}
      <div className="sticky top-14 z-30 -mx-2 sm:mx-0 px-2 sm:px-0">
        <div className="rounded-none sm:rounded-[16px] border-y sm:border border-border/50 bg-nav/85 supports-[backdrop-filter]:bg-nav/70 backdrop-blur-xl px-1 py-1">

          <div
            role="tablist"
            aria-label={`${title} sections`}
            className="w-full flex justify-start gap-0.5 overflow-x-auto scrollbar-none scroll-smooth snap-x"
          >
            {tabs.map((t) => {
              const isActive = t.id === tab;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative snap-start inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-[12px] text-[12.5px] sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0',
                    isActive
                      ? 'bg-card text-primary shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground',
                    'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-full after:bg-primary after:transition-all',
                    isActive ? 'after:w-5' : 'after:w-0'
                  )}
                >
                  <t.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary text-primary-foreground leading-none">
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Home surface stays mounted underneath */}
      <div className="space-y-4 animate-in fade-in-50 duration-200">
        <InlineErrorBoundary label="This section hit an error">
          <Suspense fallback={<Loader />}>{HomeComponent ? <HomeComponent /> : null}</Suspense>
        </InlineErrorBoundary>

        <ToolGrid
          title="All tools"
          tools={toolTabs.map((t) => ({
            id: t.id,
            label: t.label,
            description: t.description,
            icon: t.icon,
            badge: t.badge,
          }))}
          onOpen={setTab}
        />
      </div>

      {/* Tool opens as a full-screen iOS sheet */}
      <ToolSheet
        open={!!activeTool}
        onClose={closeTool}
        title={activeTool?.label ?? ''}
        subtitle={activeTool?.description}
        icon={activeTool?.icon}
        badge={activeTool?.badge}
      >
        <InlineErrorBoundary label="This tool hit an error">
          <Suspense fallback={<Loader />}>
            {ActiveComponent ? <ActiveComponent key={activeTool?.id} /> : null}
          </Suspense>
        </InlineErrorBoundary>
      </ToolSheet>
    </div>
  );
};
