import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

export const SettingsTab = () => {
  const { theme } = useTheme();

  const themeLabel = {
    light: "Light Mode",
    dark: "Dark Mode",
    system: "System",
  }[theme];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the appearance of your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-card/80 transition-colors">
            <div className="space-y-1">
              <Label className="text-base font-semibold cursor-pointer">Dark Mode Preference</Label>
              <p className="text-sm text-muted-foreground">
                Currently set to: <span className="font-medium text-foreground">{themeLabel}</span>
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Theme Options:</h3>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>
                <span className="font-medium text-foreground">Light</span> - Always use light mode
              </li>
              <li>
                <span className="font-medium text-foreground">Dark</span> - Always use dark mode
              </li>
              <li>
                <span className="font-medium text-foreground">System</span> - Follow your system preferences
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Additional settings coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More settings and preferences will be added here in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
