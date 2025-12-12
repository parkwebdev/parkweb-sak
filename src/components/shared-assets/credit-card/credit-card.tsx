import * as React from "react";
import { cn } from "@/lib/utils";

type CreditCardType = "gray-dark" | "brand-light";

interface CreditCardProps {
  type?: CreditCardType;
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  brand?: "visa" | "mastercard" | "amex" | "unknown";
  className?: string;
}

const CreditCard = React.forwardRef<HTMLDivElement, CreditCardProps>(
  ({ 
    type = "gray-dark", 
    cardNumber = "•••• •••• •••• ••••",
    cardholderName = "Card Holder",
    expiryDate = "••/••",
    brand = "visa",
    className 
  }, ref) => {
    const isDark = type === "gray-dark";

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-[340px] aspect-[1.586/1] rounded-2xl p-5 overflow-hidden",
          "shadow-lg transition-colors",
          isDark 
            ? "bg-gradient-to-br from-[hsl(0,0%,18%)] via-[hsl(0,0%,12%)] to-[hsl(0,0%,8%)]" 
            : "bg-gradient-to-br from-[hsl(250,60%,96%)] via-[hsl(220,60%,94%)] to-[hsl(200,60%,92%)]",
          className
        )}
      >
        {/* Subtle pattern overlay */}
        <div 
          className={cn(
            "absolute inset-0 opacity-[0.03]",
            isDark ? "bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)]" : "bg-[radial-gradient(circle_at_50%_50%,_black_1px,_transparent_1px)]"
          )}
          style={{ backgroundSize: '20px 20px' }}
        />
        
        {/* Gradient shine effect */}
        <div 
          className={cn(
            "absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl",
            isDark ? "bg-white/5" : "bg-primary/10"
          )}
        />

        {/* Card content */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Top row: Chip and Brand */}
          <div className="flex items-start justify-between">
            {/* Chip */}
            <div className={cn(
              "w-10 h-7 rounded-md",
              "bg-gradient-to-br from-[hsl(45,40%,70%)] via-[hsl(45,50%,60%)] to-[hsl(45,30%,50%)]",
              "shadow-sm"
            )}>
              {/* Chip lines */}
              <div className="w-full h-full flex flex-col justify-center gap-[3px] px-1.5">
                <div className="h-[2px] bg-[hsl(45,30%,45%)] rounded-full" />
                <div className="h-[2px] bg-[hsl(45,30%,45%)] rounded-full" />
                <div className="h-[2px] bg-[hsl(45,30%,45%)] rounded-full" />
              </div>
            </div>

            {/* Contactless icon */}
            <div className={cn(
              "flex items-center justify-center",
              isDark ? "text-white/60" : "text-foreground/40"
            )}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6.5 13.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5" strokeLinecap="round" />
                <path d="M4 16c2-1.333 4-2 6-2s4 .667 6 2" strokeLinecap="round" />
                <path d="M9 10.5c.5-.333 1-.5 1.5-.5s1 .167 1.5.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card Number */}
          <div className={cn(
            "text-lg font-mono tracking-[0.15em] font-medium",
            isDark ? "text-white" : "text-foreground"
          )}>
            {cardNumber}
          </div>

          {/* Bottom row: Name and Expiry */}
          <div className="flex items-end justify-between">
            <div>
              <p className={cn(
                "text-[10px] uppercase tracking-wider mb-0.5",
                isDark ? "text-white/50" : "text-muted-foreground"
              )}>
                Card Holder
              </p>
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                isDark ? "text-white" : "text-foreground"
              )}>
                {cardholderName}
              </p>
            </div>

            <div className="flex items-end gap-4">
              <div className="text-right">
                <p className={cn(
                  "text-[10px] uppercase tracking-wider mb-0.5",
                  isDark ? "text-white/50" : "text-muted-foreground"
                )}>
                  Expires
                </p>
                <p className={cn(
                  "text-xs font-medium font-mono tracking-wide",
                  isDark ? "text-white" : "text-foreground"
                )}>
                  {expiryDate}
                </p>
              </div>

              {/* Card Brand Logo */}
              <div className="h-8 flex items-center">
                {brand === "visa" && (
                  <svg viewBox="0 0 48 16" className={cn("h-4", isDark ? "text-white" : "text-[hsl(230,80%,45%)]")} fill="currentColor">
                    <path d="M19.5 1l-3.3 14h-2.9l3.3-14h2.9zm13.4 9l1.5-4.3.9 4.3h-2.4zm3.2 5h2.7l-2.4-14h-2.5c-.5 0-1 .3-1.2.8l-4.2 13.2h2.9l.6-1.7h3.6l.5 1.7zm-7.5-4.6c0-3.7-5.1-3.9-5.1-5.5 0-.5.5-1 1.6-1.1.5-.1 2-.1 3.7.6l.7-3c-.9-.3-2-.6-3.5-.6-3.7 0-6.3 2-6.3 4.8 0 2.1 1.9 3.3 3.3 4 1.4.7 1.9 1.2 1.9 1.9 0 1-.7 1.5-2 1.5-1.7 0-2.6-.5-3.4-.8l-.6 3c.8.4 2.2.7 3.7.7 3.9 0 6.4-1.9 6.4-5h-.4zm-16-9.4l-5.6 14h-3l-2.8-11.2c-.2-.6-.3-.8-.8-1.1-.9-.4-2.3-.9-3.5-1.1l.1-.6h4.7c.6 0 1.1.4 1.3 1.1l1.2 6.1 2.9-7.2h2.9z"/>
                  </svg>
                )}
                {brand === "mastercard" && (
                  <div className="flex">
                    <div className="w-6 h-6 rounded-full bg-[hsl(15,90%,55%)]" />
                    <div className="w-6 h-6 rounded-full bg-[hsl(45,100%,50%)] -ml-2.5 opacity-80" />
                  </div>
                )}
                {brand === "amex" && (
                  <div className={cn(
                    "text-xs font-bold tracking-wide",
                    isDark ? "text-white" : "text-[hsl(210,80%,45%)]"
                  )}>
                    AMEX
                  </div>
                )}
                {brand === "unknown" && (
                  <div className={cn(
                    "w-8 h-5 rounded bg-gradient-to-r",
                    isDark ? "from-white/20 to-white/10" : "from-foreground/20 to-foreground/10"
                  )} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CreditCard.displayName = "CreditCard";

export default CreditCard;
