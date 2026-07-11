import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to top on every route change so users don't land mid-page
 * when navigating between hubs / lessons / study plans.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
