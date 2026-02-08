import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[100px] w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "resize-none custom-scrollbar",
                    "[color-scheme:light] dark:[color-scheme:dark]",
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
