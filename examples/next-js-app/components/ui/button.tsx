import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-white/80 bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] text-primary-foreground shadow-[0_22px_40px_-24px_rgba(1,128,255,0.55)] hover:-translate-y-0.5 hover:brightness-[1.03]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_18px_36px_-24px_rgba(239,68,68,0.45)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline:
          "border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,255,0.92))] text-slate-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:bg-sky-50 hover:text-slate-950",
        secondary:
          "bg-[linear-gradient(180deg,rgba(238,245,255,0.95),rgba(230,239,255,0.92))] text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80",
        ghost:
          "text-slate-600 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-slate-950",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-3.5",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
