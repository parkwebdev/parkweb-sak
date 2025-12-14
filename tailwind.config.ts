import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px with 14px line-height
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
        "app-background": "hsl(var(--app-background))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        status: {
          active: {
            DEFAULT: "hsl(var(--status-active))",
            foreground: "hsl(var(--status-active-foreground))",
          },
          inactive: {
            DEFAULT: "hsl(var(--status-inactive))",
            foreground: "hsl(var(--status-inactive-foreground))",
          },
          published: {
            DEFAULT: "hsl(var(--status-published))",
            foreground: "hsl(var(--status-published-foreground))",
          },
          draft: {
            DEFAULT: "hsl(var(--status-draft))",
            foreground: "hsl(var(--status-draft-foreground))",
          },
          paused: {
            DEFAULT: "hsl(var(--status-paused))",
            foreground: "hsl(var(--status-paused-foreground))",
          },
        },
        wordpress: "hsl(var(--wordpress))",
        facebook: "hsl(var(--facebook))",
        instagram: "hsl(var(--instagram))",
        twitter: "hsl(var(--twitter))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "ping": {
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0"
          }
        },
        "pulse-slow": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "0.75"
          },
          "50%": {
            transform: "scale(1.5)",
            opacity: "0"
          }
        },
        "ripple": {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(0.9)",
          },
        },
        "pulse-ring": {
          "0%": {
            boxShadow: "0 0 0 0 hsl(var(--success) / 0.7)",
          },
          "70%": {
            boxShadow: "0 0 0 6px hsl(var(--success) / 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 hsl(var(--success) / 0)",
          },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "progress-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "ping": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "pulse-slow": "pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ripple": "ripple var(--duration, 3s) ease calc(var(--i, 0) * 0.2s) infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in-left": "slide-in-left 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "progress-shimmer": "progress-shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
