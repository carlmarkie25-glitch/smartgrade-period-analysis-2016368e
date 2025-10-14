import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

const GradingShowcase = () => {
  const sampleData = {
    periods: ["P1", "P2", "P3", "P4", "P5", "P6"],
    subjects: [
      { name: "Mathematics", scores: [85, 88, 92, 87, 90, 93] },
      { name: "English", scores: [78, 82, 85, 88, 86, 89] },
      { name: "Science", scores: [92, 90, 88, 91, 94, 95] },
    ]
  };

  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Comprehensive Grading System
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track performance across six grading periods with detailed analytics
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Sample Grade Table */}
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" />
                Student Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-primary/20">
                      <th className="text-left py-3 px-2 font-semibold text-foreground">Subject</th>
                      {sampleData.periods.map((period) => (
                        <th key={period} className="text-center py-3 px-2 font-semibold text-foreground">
                          {period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.subjects.map((subject, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-2 font-medium text-foreground">{subject.name}</td>
                        {subject.scores.map((score, scoreIdx) => (
                          <td key={scoreIdx} className="text-center py-3 px-2">
                            <Badge 
                              variant={score >= 90 ? "default" : score >= 80 ? "secondary" : "outline"}
                              className={score >= 90 ? "bg-secondary" : ""}
                            >
                              {score}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Preview */}
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Real-Time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Overall Average</span>
                  <span className="text-2xl font-bold text-primary">88.5%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary w-[88.5%] rounded-full"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Class Rank</span>
                  <span className="text-2xl font-bold text-secondary">3rd / 45</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Passed</div>
                  <div className="text-2xl font-bold text-success">14</div>
                  <div className="text-xs text-muted-foreground">subjects</div>
                </div>
                <div className="p-4 rounded-lg bg-accent border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Improvement</div>
                  <div className="text-2xl font-bold text-primary">+5.2%</div>
                  <div className="text-xs text-muted-foreground">from P1</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default GradingShowcase;
