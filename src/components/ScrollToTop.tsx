import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to top on every route change so users don't land mid-page
 * when navigating between hubs / lessons / study plans.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant jump — smooth felt janky on mobile mid-transition.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // Some routes render inside scrollable containers — reset the main one too.
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
