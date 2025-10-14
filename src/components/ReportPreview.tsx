import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";

const ReportPreview = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Professional Report Cards
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate detailed periodic and yearly reports with a single click
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Periodic Report */}
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Periodic Report Card
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">John Doe</div>
                    <div className="text-sm text-muted-foreground">Grade 10 - Period 3</div>
                    <div className="text-xs text-muted-foreground">Academic Year 2024/2025</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Mathematics</span>
                    <span className="font-semibold text-foreground">92</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">English</span>
                    <span className="font-semibold text-foreground">85</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Science</span>
                    <span className="font-semibold text-foreground">88</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t-2 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Class Rank</span>
                    <span className="text-2xl font-bold text-primary">3rd</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Report */}
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-secondary text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Final Yearly Report
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">John Doe</div>
                    <div className="text-sm text-muted-foreground">Grade 10 - Final Report</div>
                    <div className="text-xs text-muted-foreground">Academic Year 2024/2025</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-2 pb-2 border-b-2 border-border font-semibold text-xs text-muted-foreground">
                    <span>Subject</span>
                    <span className="text-center">Sem 1</span>
                    <span className="text-center">Sem 2</span>
                    <span className="text-center">Final</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 py-2 border-b border-border">
                    <span className="text-muted-foreground">Math</span>
                    <span className="text-center font-semibold">88</span>
                    <span className="text-center font-semibold">91</span>
                    <span className="text-center font-bold text-primary">89.5</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 py-2 border-b border-border">
                    <span className="text-muted-foreground">English</span>
                    <span className="text-center font-semibold">82</span>
                    <span className="text-center font-semibold">87</span>
                    <span className="text-center font-bold text-primary">84.5</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t-2 border-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Final Rank</span>
                    <span className="text-2xl font-bold text-secondary">5th</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ReportPreview;
