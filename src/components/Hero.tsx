import { Button } from "@/components/ui/button";
import { GraduationCap, TrendingUp, FileText, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-glow/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-glow/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container relative z-10 px-4 py-20 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <GraduationCap className="w-5 h-5 text-white" />
            <span className="text-sm font-medium text-white">Modern School Management Solution</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
            Welcome to <span className="text-secondary-glow">SmartGrade</span>
          </h1>

          <p className="mb-8 text-xl text-white/90 md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Comprehensive academic tracking and performance analysis designed for African educational institutions. 
            Real-time insights, automated rankings, and detailed reporting at your fingertips.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-success hover:scale-105 transition-transform">
                Get Started
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
              Learn More
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Real-Time Rankings"
              description="Automated student rankings after each grading period"
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Detailed Reports"
              description="Comprehensive periodic and yearly report cards"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Smart Analytics"
              description="Pass/fail statistics and performance insights"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all hover:scale-105 hover:shadow-glow">
      <div className="text-secondary-glow mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  );
};

export default Hero;
