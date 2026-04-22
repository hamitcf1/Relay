import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorBoundaryProps {
    children: ReactNode
    /** Optional fallback UI. If not provided, a default error card is shown. */
    fallback?: ReactNode
    /** Module name to display in the error message */
    module?: string
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Error Boundary component that catches JavaScript errors in its child component tree.
 * Displays a styled error card with retry functionality.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary module="Roster">
 *   <RosterMatrix />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error(`[ErrorBoundary${this.props.module ? ` - ${this.props.module}` : ''}]`, error, errorInfo)
        this.props.onError?.(error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center min-h-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">
                            {this.props.module ? `${this.props.module} — Error` : 'Something went wrong'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleRetry}
                        className="gap-2"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
