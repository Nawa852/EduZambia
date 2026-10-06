import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNavigationByRole, matchesNavItem } from "./sidebarConfig";
import { useProfile } from "@/hooks/useProfile";
import { ScrollArea } from "@/components/ui/scroll-area";
import eduIcon from "@/assets/brandLogo";
import { Button } from '@/components/ui/button';

export function RoleBasedSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile } = useProfile();

  const userType = profile?.role || "student";
  const navigation = getNavigationByRole(userType);
  const isActive = (item: { url: string; matchPrefixes?: string[] }) => matchesNavItem(location.pathname, item);

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        className={cn(collapsed ? "w-[60px]" : "w-[230px]", "transition-all duration-200")}
        collapsible="icon"
      >
        <SidebarContent className="bg-sidebar border-r border-sidebar-border flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-3 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5 w-full">
              <img src={eduIcon} alt="Synapse" className="w-8 h-8 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="font-bold text-sm text-foreground">Synapse</span>
                  <Button variant="ghost" size="icon" aria-label="Collapse sidebar" title="Collapse sidebar" onClick={toggleSidebar} className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            {navigation.map((group) => (
              <SidebarGroup key={group.label} className="px-2 py-0 mb-1">
                {!collapsed && (
                  <SidebarGroupLabel className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item);
                      const linkEl = (
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px]",
                            active
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-sidebar-foreground hover:bg-secondary/80 hover:text-foreground",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <item.icon aria-hidden="true" className={cn("h-[18px] w-[18px] flex-shrink-0", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2 : 1.7} />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.title}</span>
                              {item.badge && (
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
                                  item.badge === 'LIVE' ? "bg-destructive/15 text-destructive" :
                                  item.badge === 'AI' ? "bg-primary/15 text-primary" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      );

                      return (
                        <SidebarMenuItem key={`${item.title}-${item.url}`}>
                          <SidebarMenuButton asChild className="h-auto p-0">
                            {collapsed ? (
                              <Tooltip>
                                <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                                <TooltipContent side="right" className="text-xs font-medium">
                                  {item.title}
                                </TooltipContent>
                              </Tooltip>
                            ) : linkEl}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </ScrollArea>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
