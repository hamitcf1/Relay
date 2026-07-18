import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold tracking-[0.01em] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-primary/20 bg-primary/[0.12] text-primary",
                secondary:
                    "border-border/30 bg-secondary/80 text-secondary-foreground",
                destructive:
                    "border-destructive/25 bg-destructive/[0.12] text-destructive",
                success:
                    "border-success/25 bg-success/[0.12] text-success",
                outline:
                    "border-border/70 text-muted-foreground",
                room:
                    "cursor-pointer border-primary/25 bg-primary/10 text-primary hover:bg-primary/[0.16]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
