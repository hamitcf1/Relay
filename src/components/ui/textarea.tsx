import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[110px] w-full rounded-[1rem] border border-input/70 bg-background/[0.55] px-3.5 py-3 text-sm leading-relaxed text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] placeholder:text-muted-foreground/75 transition-[background-color,border-color,box-shadow] duration-500 ease-premium",
                    "focus:border-primary/[0.55] focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "resize-none custom-scrollbar",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
