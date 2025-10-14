import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GradingShowcase from "@/components/GradingShowcase";
import ReportPreview from "@/components/ReportPreview";
import CallToAction from "@/components/CallToAction";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <GradingShowcase />
      <ReportPreview />
      <CallToAction />
    </div>
  );
};

export default Index;
