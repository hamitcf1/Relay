import { useEffect } from 'react'
import { useLogsStore } from '@/stores/logsStore'

export function TabNotifications() {
    const { logs } = useLogsStore()

    useEffect(() => {
        const activeCount = logs ? logs.filter(l => l.status === 'open').length : 0

        if (activeCount > 0) {
            document.title = `(${activeCount}) Relay Operations`
        } else {
            document.title = 'Relay Operations'
        }
    }, [logs])

    return null
}
