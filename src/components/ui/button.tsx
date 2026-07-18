import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[-0.01em] transition-[transform,background-color,color,box-shadow,border-color] duration-500 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 enabled:active:scale-[0.975]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-[0_10px_30px_-16px_hsl(var(--primary)/0.9),inset_0_1px_0_hsl(0_0%_100%/0.28)] hover:bg-primary/92",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-[0_10px_28px_-18px_hsl(var(--destructive)/0.85),inset_0_1px_0_hsl(0_0%_100%/0.2)] hover:bg-destructive/90",
                outline:
                    "border border-border/70 bg-background/[0.35] text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)] hover:border-primary/40 hover:bg-primary/[0.08]",
                secondary:
                    "bg-secondary/80 text-secondary-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)] hover:bg-secondary",
                ghost:
                    "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                link:
                    "h-auto rounded-none px-0 text-primary underline-offset-4 hover:translate-y-0 hover:underline",
                success:
                    "bg-success text-success-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2)] hover:bg-success/90",
            },
            size: {
                default: "h-11 px-5 py-2.5",
                sm: "h-9 px-3.5 text-xs",
                lg: "h-12 px-6 text-[0.95rem]",
                icon: "h-11 w-11 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
