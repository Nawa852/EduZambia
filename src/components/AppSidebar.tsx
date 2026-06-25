import React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  User,
  Brain,
  Users,
  BarChart3,
  Trophy,
  FolderOpen,
  GraduationCap,
  Video,
  Settings,
  Zap
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import EduZambiaLogo from "@/assets/edu-zambia-logo.svg"

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const location = useLocation()

  const userName = localStorage.getItem('edu-zambia-onboarding') 
    ? JSON.parse(localStorage.getItem('edu-zambia-onboarding') || '{}').fullName || 'Student'
    : 'Student'

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "AI Tutor", url: "/ai", icon: Brain },
    { title: "My Courses", url: "/courses", icon: BookOpen },
    { title: "Community", url: "/community", icon: Users },
    { title: "Materials", url: "/materials", icon: FolderOpen },
    { title: "Classroom", url: "/classroom", icon: Video },
    { title: "Lessons", url: "/lessons", icon: GraduationCap },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Achievements", url: "/achievements", icon: Trophy },
    { title: "Profile", url: "/profile", icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar className={cn(
        collapsed ? "w-[70px]" : "w-[240px]",
        "transition-all duration-300 ease-in-out"
      )} collapsible="icon">
        <SidebarContent className="bg-card border-r border-border">
          {/* Header */}
          <div className={cn("border-b border-border", collapsed ? "p-3" : "p-4")}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 shrink-0">
                <img src={EduZambiaLogo} alt="Nexus Learning" className="w-7 h-7" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-sm text-foreground tracking-tight">
                    BrightSphere
                  </h2>
                  <p className="text-[11px] text-muted-foreground">AI Learning</p>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className={cn(
            "rounded-lg bg-secondary/50 border border-border/50",
            collapsed ? "mx-2 my-2 p-2" : "mx-3 my-3 p-3"
          )}>
            <div className="flex items-center gap-2.5">
              <Avatar className={cn("ring-2 ring-primary/20 shrink-0", collapsed ? "h-8 w-8" : "h-9 w-9")}>
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{userName}</h3>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] text-muted-foreground">Level 1</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <SidebarGroup className="px-2 py-1 flex-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {navItems.map((item) => {
                  const active = isActive(item.url);
                  const link = (
                    <NavLink 
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
                      {!collapsed && <span className={cn("text-sm", active ? "font-semibold" : "font-medium")}>{item.title}</span>}
                    </NavLink>
                  );

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-auto p-0">
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent side="right" className="text-xs font-medium">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : link}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Footer */}
          <div className={cn("border-t border-border mt-auto", collapsed ? "p-2" : "p-3")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink 
                    to="/settings"
                    className={cn(
                      "flex items-center justify-center p-2.5 rounded-lg transition-colors",
                      isActive('/settings')
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Settings className="h-[18px] w-[18px]" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">Settings</TooltipContent>
              </Tooltip>
            ) : (
              <NavLink 
                to="/settings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive('/settings')
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Settings className="h-[18px] w-[18px]" />
                <span className="text-sm font-medium">Settings</span>
              </NavLink>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  )
}
