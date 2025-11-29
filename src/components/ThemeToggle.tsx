import { Moon02 as Moon, Sun } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation';

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { ref, toggleSwitchTheme, isDarkMode } = useModeAnimation({
    animationType: ThemeAnimationType.BLUR_CIRCLE,
    blurAmount: 2,
    duration: 600
  });

  const handleToggle = () => {
    const newTheme = theme === 'dark' || (theme === 'system' && isDarkMode) ? 'light' : 'dark';
    toggleSwitchTheme();
    setTheme(newTheme);
  };

  const isCurrentlyDark = theme === 'dark' || (theme === 'system' && isDarkMode);

  return (
    <Button 
      ref={ref as any}
      variant="outline" 
      size="sm" 
      className={`relative p-0 ${isCollapsed ? 'h-6 w-6' : 'h-7 w-7'}`}
      onClick={handleToggle}
    >
      {isCurrentlyDark ? (
        <Moon className={isCollapsed ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      ) : (
        <Sun className={isCollapsed ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}