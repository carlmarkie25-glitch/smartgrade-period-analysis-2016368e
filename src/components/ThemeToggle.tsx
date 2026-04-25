import { Moon, Sun, MonitorCog, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center justify-between cursor-pointer ${theme === "light" ? "bg-accent" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
          {theme === "light" && <div className="h-2 w-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-between cursor-pointer ${theme === "dark" ? "bg-accent" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <div className="h-2 w-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center justify-between cursor-pointer ${theme === "system" ? "bg-accent" : ""}`}
        >
          <div className="flex items-center gap-2">
            <MonitorCog className="h-4 w-4" />
            <span>System</span>
          </div>
          {theme === "system" && <div className="h-2 w-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <div className="h-px bg-border my-1" />
        <DropdownMenuItem
          onClick={() => setTheme("navy")}
          className={`flex items-center justify-between cursor-pointer ${theme === "navy" ? "bg-accent" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-600" />
            <span>Navy Blue</span>
          </div>
          {theme === "navy" && <div className="h-2 w-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("purple")}
          className={`flex items-center justify-between cursor-pointer ${theme === "purple" ? "bg-accent" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-600" />
            <span>Royal Purple</span>
          </div>
          {theme === "purple" && <div className="h-2 w-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
