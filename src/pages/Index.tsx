import { useAuth } from "@/components/Auth/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SplashLanding from "@/components/Landing/SplashLanding";
import { LogoLoader } from "@/components/UI/LogoLoader";

const Index = () => {
  const { user, loading, isDemo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (user || isDemo)) {
      navigate('/dashboard');
    }
  }, [user, loading, isDemo, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LogoLoader size="lg" text="Loading..." />
      </div>
    );
  }

  return <MVPLanding />;
};

export default Index;
