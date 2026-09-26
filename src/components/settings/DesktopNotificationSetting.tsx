import { useEffect, useState } from 'react'
import { BellRing, TriangleAlert } from 'lucide-react'

import { Toggle } from '@/components/ui/Toggle'
import {
    getDesktopPermission,
    requestDesktopPermission,
    type DesktopPermission,
} from '@/lib/desktopNotifications'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'

/**
 * The desktop notification switch.
 *
 * The awkward part of this setting is that it is two decisions wearing one control. Whether the
 * user wants desktop notifications is ours to store and travels with the account. Whether the
 * browser will show them is the browser's, is per device, and can be withdrawn at any time without
 * the account hearing about it. So the switch stores the preference, and whatever the browser says
 * is shown next to it, including when the two disagree.
 */
export function DesktopNotificationSetting() {
    const { t } = useLanguageStore()
    const { user, updateSettings } = useAuthStore()
    const [permission, setPermission] = useState<DesktopPermission>('default')
    const [asking, setAsking] = useState(false)

    const enabled = user?.settings?.desktop_notifications === true

    // Read on mount and whenever the panel opens, because the user can change the browser's mind
    // in another tab or another window and come back.
    useEffect(() => {
        setPermission(getDesktopPermission())
    }, [])

    const handleChange = async () => {
        if (enabled) {
            await updateSettings({ desktop_notifications: false })
            return
        }

        setAsking(true)
        try {
            // This call only works because the switch was clicked. Anything that moved the request
            // off a user gesture, such as asking on the first arrival, would be refused.
            const result = await requestDesktopPermission()
            setPermission(result)

            // Only stored once the browser has actually agreed. Recording the preference over a
            // refusal would leave a switch that reads "on" and does nothing, which is worse than
            // saying no.
            if (result === 'granted') {
                await updateSettings({ desktop_notifications: true })
            }
        } finally {
            setAsking(false)
        }
    }

    // A denial is reported whether or not the preference is on.
    //
    // The case that matters is the one where it is off: the switch was clicked, the browser said
    // no, nothing was stored, and the switch looks exactly as it did a moment earlier. Describing
    // that as simply "off" is true and useless, because the user has just been told nothing about
    // why their click did nothing. A browser only reaches "denied" by being refused, either here
    // or in its own settings earlier, and in both cases turning this on cannot work.
    const blocked = permission === 'denied'
    const unsupported = permission === 'unsupported'

    let description: string
    if (unsupported) description = t('settings.desktopNotifications.unsupported')
    else if (blocked) description = t('settings.desktopNotifications.blocked')
    else if (permission === 'default') description = t('settings.desktopNotifications.willAsk')
    else if (enabled) description = t('settings.desktopNotifications.on')
    else description = t('settings.desktopNotifications.off')

    return (
        <div className="space-y-2" data-testid="desktop-notification-setting">
            <div className="flex items-center gap-2 px-1">
                <BellRing className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('settings.desktopNotifications.title')}
                </label>
            </div>

            <Toggle
                label={t('settings.desktopNotifications.label')}
                description={description}
                value={enabled}
                disabled={asking || unsupported}
                onChange={handleChange}
            />

            {blocked && (
                <p className="flex items-start gap-1.5 px-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                    {t('settings.desktopNotifications.blockedHint')}
                </p>
            )}
        </div>
    )
}
