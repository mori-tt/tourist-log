import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90 focus:bg-primary focus:ring-0 focus-visible:ring-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive focus:ring-0 focus-visible:ring-0",
        outline:
          "border border-input bg-background hover:bg-background hover:text-primary hover:border-primary focus:bg-background focus:text-primary focus:border-primary focus:ring-0 focus-visible:ring-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:bg-secondary focus:ring-0 focus-visible:ring-0",
        ghost:
          "hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary focus:ring-0 focus-visible:ring-0",
        link: "text-primary underline-offset-4 hover:underline focus:text-primary focus:ring-0 focus-visible:ring-0",
        travel:
          "bg-primary text-white hover:bg-primary/90 active:bg-primary/90 focus:bg-primary focus:ring-0 focus-visible:ring-0 shadow-sm hover:shadow",
        travelOutline:
          "border-2 border-primary text-primary hover:text-primary/80 active:text-primary/80 focus:text-primary focus:border-primary focus:ring-0 focus-visible:ring-0 focus:bg-background",
        travelAccent:
          "bg-accent text-accent-foreground hover:bg-accent/80 focus:bg-accent focus:ring-0 focus-visible:ring-0 shadow-sm hover:shadow",
        travelNav:
          "bg-transparent text-foreground hover:text-primary active:text-primary focus:text-primary focus:bg-transparent focus:ring-0 focus-visible:ring-0",
        travelBack:
          "bg-transparent text-foreground hover:text-foreground/80 active:text-foreground/80 focus:text-foreground focus:bg-transparent focus:ring-0 focus-visible:ring-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
