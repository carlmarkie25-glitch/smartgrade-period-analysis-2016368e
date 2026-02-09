import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GradingShowcase from "@/components/GradingShowcase";
import ReportPreview from "@/components/ReportPreview";
import CallToAction from "@/components/CallToAction";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <GradingShowcase />
      <ReportPreview />
      <CallToAction />
    </div>
  );
};

export default Index;
