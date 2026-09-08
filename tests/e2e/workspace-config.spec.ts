import { expect, test } from '@playwright/test'
import { normalizeCompactLayout, resolveWorkspaceTarget } from '../../src/lib/workspace'

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
})
