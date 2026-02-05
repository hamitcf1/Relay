import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg glow-primary hover:from-indigo-600 hover:to-purple-700",
                destructive:
                    "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg glow-critical hover:from-rose-600 hover:to-red-700",
                outline:
                    "border border-zinc-700 bg-transparent hover:bg-zinc-800 hover:border-zinc-600",
                secondary:
                    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
                ghost:
                    "hover:bg-zinc-800/50 hover:text-zinc-100",
                link:
                    "text-indigo-400 underline-offset-4 hover:underline",
                success:
                    "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg glow-success hover:from-emerald-600 hover:to-green-700",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-10 w-10",
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
