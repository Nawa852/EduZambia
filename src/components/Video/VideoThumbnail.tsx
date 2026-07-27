import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  videoId?: string;
  src?: string;
  alt: string;
}

/**
 * YouTube thumbnails 404 when a quality tier is missing, which floods the
 * console with errors. This walks down the quality ladder, then falls back
 * to a branded gradient placeholder.
 */
export const VideoThumbnail: React.FC<Props> = ({ videoId, src, alt, className, ...rest }) => {
  const ladder = videoId
    ? [
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/default.jpg`,
      ]
    : src
      ? [src]
      : [];

  const [index, setIndex] = useState(0);
  const exhausted = index >= ladder.length;

  if (exhausted) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 text-muted-foreground',
          className,
        )}
      >
        <span className="text-xs font-medium px-2 text-center line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={ladder[index]}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
};

export default VideoThumbnail;
