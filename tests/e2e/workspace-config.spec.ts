import { expect, test } from '@playwright/test'
import { buildUserSettingsPatch, normalizeCompactLayout, resolveWorkspaceTarget } from '../../src/lib/workspace'
import { useNavigationEditorStore } from '../../src/stores/navigationEditorStore'

test.describe('Compact workspace configuration', () => {
  test('fills a missing compact layout with the supported default modules', () => {
    expect(normalizeCompactLayout(undefined)).toEqual({
      left: ['notes', 'roster', 'blacklist'],
      right: ['hotel-info', 'currency', 'menu', 'calendar'],
    })
  })

  test('removes duplicate and unknown modules while restoring missing modules', () => {
    expect(normalizeCompactLayout({
      left: ['calendar', 'notes', 'notes', 'unknown'],
      right: ['hotel-info'],
    })).toEqual({
      left: ['calendar', 'notes', 'roster', 'blacklist'],
      right: ['hotel-info', 'currency', 'menu'],
    })
  })

  test('maps shared modules to the correct compact workspace area', () => {
    expect(resolveWorkspaceTarget('roster', 'compact')).toEqual({ area: 'shift', moduleId: 'roster' })
    expect(resolveWorkspaceTarget('messaging', 'compact')).toEqual({ area: 'operations', moduleId: 'messaging' })
    expect(resolveWorkspaceTarget('overview', 'compact')).toEqual({ area: 'operations', moduleId: 'overview' })
    expect(resolveWorkspaceTarget('not-a-module', 'compact')).toEqual({ area: 'operations', moduleId: 'overview' })
  })

  test('patches only changed account preference paths', () => {
    expect(buildUserSettingsPatch({ workspace_mode: 'compact', compact_operation_tab: 'sales' })).toEqual({
      'settings.workspace_mode': 'compact',
      'settings.compact_operation_tab': 'sales',
    })
  })

  test('resets an unpublished navigation draft when the hotel changes', () => {
    const editor = useNavigationEditorStore.getState()
    editor.load(undefined, 'hotel-a')
    editor.renameSection('today', 'Unpublished name')
    expect(useNavigationEditorStore.getState().dirty).toBe(true)

    useNavigationEditorStore.getState().load(undefined, 'hotel-b')
    expect(useNavigationEditorStore.getState().loadedHotelId).toBe('hotel-b')
    expect(useNavigationEditorStore.getState().dirty).toBe(false)
  })
})
