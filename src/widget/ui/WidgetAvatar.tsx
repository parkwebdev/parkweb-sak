/**
 * WidgetAvatar Component
 * 
 * Lightweight avatar matching src/components/ui/avatar.tsx exactly.
 * Pure React implementation without @radix-ui/react-avatar.
 * 
 * @module widget/ui/WidgetAvatar
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// Context for image load state
const AvatarContext = React.createContext<{
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
}>({
  imageLoaded: false,
  setImageLoaded: () => {},
});

interface WidgetAvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Avatar container component.
 * EXACT classes from src/components/ui/avatar.tsx
 */
const WidgetAvatar = React.forwardRef<HTMLDivElement, WidgetAvatarProps>(
  ({ className, children, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);

    return (
      <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
        <div
          ref={ref}
          className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </AvatarContext.Provider>
    );
  }
);
WidgetAvatar.displayName = "WidgetAvatar";

interface WidgetAvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

/**
 * Avatar image component.
 * EXACT classes from src/components/ui/avatar.tsx
 */
const WidgetAvatarImage = React.forwardRef<HTMLImageElement, WidgetAvatarImageProps>(
  ({ className, src, alt, onLoad, onError, ...props }, ref) => {
    const { setImageLoaded } = React.useContext(AvatarContext);
    const [hasError, setHasError] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
      setHasError(false);
      setImageLoaded(false);
    }, [src, setImageLoaded]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageLoaded(true);
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      setImageLoaded(false);
      onError?.(e);
    };

    if (hasError || !src) {
      return null;
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn("aspect-square h-full w-full", className)}
        {...props}
      />
    );
  }
);
WidgetAvatarImage.displayName = "WidgetAvatarImage";

interface WidgetAvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible label for the fallback */
  "aria-label"?: string;
}

/**
 * Avatar fallback component shown when image fails to load.
 * EXACT classes from src/components/ui/avatar.tsx
 */
const WidgetAvatarFallback = React.forwardRef<HTMLDivElement, WidgetAvatarFallbackProps>(
  ({ className, children, "aria-label": ariaLabel, ...props }, ref) => {
    const { imageLoaded } = React.useContext(AvatarContext);

    // Don't render fallback if image loaded successfully
    if (imageLoaded) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="img"
        aria-label={ariaLabel || (typeof children === 'string' ? `Avatar: ${children}` : undefined)}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
WidgetAvatarFallback.displayName = "WidgetAvatarFallback";

export { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback };
