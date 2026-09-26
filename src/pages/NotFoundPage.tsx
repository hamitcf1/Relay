import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/stores/languageStore'

/**
 * Rendered for any URL the router does not recognise.
 *
 * Without a catch all route, React Router matches nothing and paints an empty document. A stale
 * bookmark or a mistyped link looked identical to a broken app, which sent people to support for
 * something that is a one line fix.
 */
export function NotFoundPage() {
    const t = useLanguageStore(s => s.t)

    return (
        <div
            data-testid="not-found"
            className="min-h-dvh flex items-center justify-center bg-background px-6 py-16"
        >
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Compass className="size-6" aria-hidden />
                </div>

                <p className="text-sm font-semibold text-primary">404</p>
                <h1 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-foreground">
                    {t('error.notFound.title')}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t('error.notFound.body')}
                </p>

                <Button asChild className="mt-7">
                    <Link to="/">{t('error.notFound.back')}</Link>
                </Button>
            </div>
        </div>
    )
}
