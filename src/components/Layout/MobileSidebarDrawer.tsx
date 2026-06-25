import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getNavigationByRole, matchesNavItem, roleLabels } from '@/components/Sidebar/sidebarConfig';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import eduIcon from '@/assets/edu-zambia-icon.png';

export const MobileSidebarDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const [open, setOpen] = React.useState(false);

  const role = (profile?.role as string) || 'student';
  const navigation = getNavigationByRole(role);
  const roleLabel = roleLabels[role] || 'Student';

  const go = (url: string) => {
    setOpen(false);
    // small delay to let sheet close animation start
    setTimeout(() => navigate(url), 50);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className="lg:hidden h-9 w-9 text-foreground hover:bg-secondary/70 rounded-xl shrink-0"
        >
          <Menu className="h-[20px] w-[20px]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border/40">
          <SheetTitle asChild>
            <div className="flex items-center gap-2.5">
              <img src={eduIcon} alt="Edu Zambia" className="w-9 h-9 rounded-lg" />
              <div className="flex flex-col items-start">
                <span className="font-bold text-[15px] text-foreground tracking-tight">Edu Zambia</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{roleLabel}</span>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Profile preview */}
        <button
          onClick={() => go('/profile')}
          className="flex items-center gap-3 px-4 py-3 border-b border-border/40 hover:bg-secondary/50 transition-colors text-left"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{profile?.full_name || 'User'}</p>
            <p className="text-[11px] text-muted-foreground truncate">View profile</p>
          </div>
        </button>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-3">
            {navigation.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em]">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = matchesNavItem(location.pathname, item);
                    return (
                      <button
                        key={`${group.label}-${item.url}-${item.title}`}
                        onClick={() => go(item.url)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-[14px]',
                          active
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-foreground/80 hover:bg-secondary/80 hover:text-foreground'
                        )}
                      >
                        <item.icon
                          className={cn('h-[18px] w-[18px] flex-shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
                          strokeWidth={active ? 2.5 : 1.8}
                        />
                        <span className="flex-1 text-left truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                              item.badge === 'LIVE'
                                ? 'bg-destructive/15 text-destructive'
                                : item.badge === 'AI'
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="border-t border-border/40 p-2 space-y-0.5">
          <button
            onClick={() => go('/profile?tab=settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-foreground/80 hover:bg-secondary/80 transition-colors"
          >
            <Settings className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
            <span className="flex-1 text-left">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
