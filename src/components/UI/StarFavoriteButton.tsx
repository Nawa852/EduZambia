import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/useFavorites';

interface StarFavoriteButtonProps {
  label: string;
  url: string;
  icon?: string;
  className?: string;
  showLabel?: boolean;
}

/** One-tap bookmark so a teacher can pin a place and jump straight back to it. */
export const StarFavoriteButton: React.FC<StarFavoriteButtonProps> = ({
  label, url, icon, className, showLabel = true,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const starred = isFavorite(url);

  return (
    <Button
      type="button"
      variant={starred ? 'secondary' : 'outline'}
      size="sm"
      className={cn('rounded-xl gap-1.5', className)}
      aria-pressed={starred}
      aria-label={starred ? `Remove ${label} from favourites` : `Star ${label}`}
      onClick={async () => {
        const now = await toggleFavorite({ label, url, icon });
        toast.success(now ? `${label} starred — find it in your sidebar` : `${label} removed from favourites`);
      }}
    >
      <Star className={cn('w-4 h-4', starred && 'fill-current text-amber-500')} />
      {showLabel && <span className="hidden sm:inline">{starred ? 'Starred' : 'Star'}</span>}
    </Button>
  );
};

export default StarFavoriteButton;
