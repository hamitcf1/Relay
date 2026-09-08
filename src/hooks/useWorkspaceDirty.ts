import { useEffect } from 'react'
import { useWorkspaceEditStore } from '@/stores/workspaceEditStore'

export function useWorkspaceDirty(id: string, dirty: boolean) {
    const setDirty = useWorkspaceEditStore((state) => state.setDirty)
    useEffect(() => {
        setDirty(id, dirty)
        return () => setDirty(id, false)
    }, [dirty, id, setDirty])
}
