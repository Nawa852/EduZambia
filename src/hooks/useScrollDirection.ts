import { useEffect, useRef, useState } from 'react';

/**
 * Facebook-style scroll behaviour: chrome hides when the user scrolls down and
 * reappears the moment they scroll up (or reach the top of the page).
 */
export function useScrollDirection(threshold = 8) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;

      setAtTop(y < 12);

      if (Math.abs(delta) > threshold) {
        // Never hide near the very top or when the page barely scrolls.
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setHidden(delta > 0 && y > 72 && scrollable > 160);
        lastY.current = y;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { hidden, atTop };
}

export default useScrollDirection;
