import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntity } from "@/context/EntityContext";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useEntity();

    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`rounded-full transition-colors ${className}`}
            aria-label="Toggle theme"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-100" />
        </Button>
    );
}
