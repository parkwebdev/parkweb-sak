import { Moon02 as Moon, Sun } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ThemeProvider';

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`p-0 ${isCollapsed ? 'h-6 w-6' : 'h-7 w-7'}`}>
          <Sun className={`rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 ${isCollapsed ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
          <Moon className={`absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 ${isCollapsed ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}