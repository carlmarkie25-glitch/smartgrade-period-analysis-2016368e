import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Lock, Users, Award, PieChart, Calendar } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Calculator className="w-10 h-10 text-primary" />,
      title: "Multi-Period Grading",
      description: "Track student performance across six grading periods (P1-P6) with weighted assessments totaling 100 points per subject."
    },
    {
      icon: <Lock className="w-10 h-10 text-primary" />,
      title: "Grade Locking System",
      description: "Secure grade submission with administrative controls. Only admins can unlock grades after submission for modifications."
    },
    {
      icon: <Award className="w-10 h-10 text-secondary" />,
      title: "Automated Ranking",
      description: "Real-time class rankings calculated automatically after each period, providing instant performance insights."
    },
    {
      icon: <Users className="w-10 h-10 text-secondary" />,
      title: "Student Portal",
      description: "Dedicated access for students and parents to view grades, report cards, and performance analytics anytime."
    },
    {
      icon: <PieChart className="w-10 h-10 text-primary" />,
      title: "Analytics Dashboard",
      description: "Comprehensive school-wide statistics including pass/fail rates, departmental leaderboards, and trend analysis."
    },
    {
      icon: <Calendar className="w-10 h-10 text-secondary" />,
      title: "Semester Averages",
      description: "Automatic calculation of semester and yearly averages based on period grades and final exams."
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Powerful Features for Modern Schools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage academic performance and drive student success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="pt-6">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
