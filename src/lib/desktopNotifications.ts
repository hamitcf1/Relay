/**
 * Desktop notifications, through the browser's own Notification API.
 *
 * ## What this can and cannot do
 *
 * It raises a notification on the machine the browser is running on. That is the whole of it: the
 * tab has to be open, and the browser has to allow it. A notification for a tab that is closed
 * needs a push service, which means a server holding VAPID keys and a service worker, and nothing
 * here pretends to do that. The user asked for the machine that is open to be told, and this is
 * that and nothing more.
 *
 * ## Why the permission is requested from a toggle
 *
 * Browsers refuse `requestPermission()` outside a user gesture, so this cannot be requested on the
 * manager's behalf when a notification first arrives. The settings toggle is the gesture, which is
 * why the permission state and the preference are kept apart: the preference is ours to store, the
 * permission is the browser's, and the two can disagree.
 */

export type DesktopPermission = 'unsupported' | 'default' | 'granted' | 'denied'

interface DesktopNotificationInput {
    title: string
    body?: string
    /**
     * Collapses repeats of the same notification into one entry. The tag is what the platform keys
     * on, so two notifications sharing a tag do not stack up.
     */
    tag?: string
    /** Keeps the toast on screen until dismissed. For money owed, which is worth acting on. */
    requireInteraction?: boolean
}

/** No `Notification` at all: an old browser, or a page served over plain http. */
export function getDesktopPermission(): DesktopPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return window.Notification.permission as DesktopPermission
}

/**
 * Asks the browser for permission. Only call this from a user gesture.
 *
 * The callback form is handled as well as the promise form because Safari still ships the older
 * signature on some versions, and a rejected call here would leave the toggle stuck on.
 */
export async function requestDesktopPermission(): Promise<DesktopPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'

    try {
        const result = await new Promise<NotificationPermission>((resolve, reject) => {
            const maybePromise = window.Notification.requestPermission(resolve)
            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.then(resolve, reject)
            }
        })
        return result as DesktopPermission
    } catch (error) {
        console.error('Could not request notification permission:', error)
        return getDesktopPermission()
    }
}

/**
 * Raises one notification. Returns whether it was actually shown, so a caller can tell the
 * difference between "delivered" and "we chose not to".
 */
export function showDesktopNotification(input: DesktopNotificationInput): boolean {
    if (getDesktopPermission() !== 'granted') return false

    try {
        // No icon is passed on purpose. The only brand asset in public/ is a 1.5MB board image and
        // an SVG, and Windows toasts do not render SVG reliably, so the platform default is the
        // better outcome than a path that resolves to nothing.
        new Notification(input.title, {
            body: input.body,
            tag: input.tag,
            requireInteraction: input.requireInteraction ?? false,
        })
        return true
    } catch (error) {
        // Thrown when the platform refuses, which it does on some builds when a page is not
        // considered active, and when too many notifications are already queued. Neither is worth
        // breaking the caller over: the in-app notification has already been recorded.
        console.error('Could not show desktop notification:', error)
        return false
    }
}
