import { expect, test } from '@playwright/test'
import { getModuleLabel, getModuleShortLabel, resolveNavigation, resolvePersonalNavigation } from '../../src/lib/navigation'
import { normalizeNavigationConfig } from '../../src/lib/navigationDefaults'
import { MOBILE_SLOT_COUNT } from '../../src/config/moduleRegistry'
import { findModule } from '../../src/lib/navigation'
import type { HotelNavigationConfig, UserSettings } from '../../src/types'

const config = normalizeNavigationConfig(undefined)
const prefs = (over: Partial<NonNullable<UserSettings['sidebar_preferences']>>) => ({
  favorite_ids: [],
  module_order: [],
  section_by_module: {},
  ...over,
})
const ids = (items: { id: string }[]) => items.map((item) => item.id)

test.describe('shared navigation defaults', () => {
  test('does not pin any module to the first sidebar slot', () => {
    const order = ids(resolveNavigation('gm', config).primary)
    expect(order).toEqual(config.primaryModuleIds)
    expect(order[0]).toBe('overview')
    expect(order).toContain('personal-notes')
  })

  test('derives section membership from the registry and keeps admin section names', () => {
    const renamed = normalizeNavigationConfig({
      ...config,
      primaryModuleIds: ['overview'],
      sections: [{ id: 'today', name: 'Sabah', moduleIds: [] }, { id: 'tools', name: 'Araçlar', moduleIds: [] }],
    })
    const resolved = resolveNavigation('gm', renamed)
    const today = resolved.sections.find((section) => section.id === 'today')!
    expect(today.name).toBe('Sabah')
    expect(ids(today.items)).toEqual(['notes', 'personal-notes', 'roster'])
    expect(renamed.sections.map((section) => section.id)).toEqual(['today', 'operations', 'tools', 'management'])
  })

  test('drops unknown and duplicate ids but keeps an explicit choice', () => {
    const messy = normalizeNavigationConfig({
      ...config,
      primaryModuleIds: ['notes', 'notes', 'not-a-module'],
      mobileModuleIds: ['overview', 'notes', 'roster', 'messaging', 'sales'],
    })
    expect(messy.primaryModuleIds).toEqual(['notes'])
    expect(messy.mobileModuleIds).toEqual(['overview', 'notes', 'roster', 'messaging'])
    expect(messy.mobileModuleIds).toHaveLength(MOBILE_SLOT_COUNT)
  })

  test('falls back to the built-in defaults when a stored list is entirely unusable', () => {
    const broken = normalizeNavigationConfig({ ...config, primaryModuleIds: ['gone', 'also-gone'] })
    expect(broken.primaryModuleIds).toEqual(config.primaryModuleIds)
  })
})

test.describe('admin renamed tabs', () => {
  const renamed: HotelNavigationConfig = {
    ...config,
    customLabels: {
      'personal-notes': { tr: 'Notlar', short: { tr: 'Notlar' } },
      roster: { en: 'Roster board' },
    },
  }

  test('uses the admin name and falls back per language', () => {
    const notes = findModule('personal-notes')!
    expect(getModuleLabel(notes, 'tr', renamed)).toBe('Notlar')
    expect(getModuleLabel(notes, 'en', renamed)).toBe('Personal notes')
    const roster = findModule('roster')!
    expect(getModuleLabel(roster, 'en', renamed)).toBe('Roster board')
    expect(getModuleLabel(roster, 'tr', renamed)).toBe('Haftalık vardiya')
  })

  test('treats blank overrides as unset', () => {
    const blank: HotelNavigationConfig = { ...config, customLabels: { 'personal-notes': { tr: '   ' } } }
    expect(getModuleLabel(findModule('personal-notes')!, 'tr', blank)).toBe('Kişisel notlar')
  })

  test('prefers an explicit short name, then a short custom name, then the registry short', () => {
    const notes = findModule('personal-notes')!
    expect(getModuleShortLabel(notes, 'tr', renamed)).toBe('Notlar')
    const shortEnough: HotelNavigationConfig = { ...config, customLabels: { roster: { tr: 'Vardiya' } } }
    expect(getModuleShortLabel(findModule('roster')!, 'tr', shortEnough)).toBe('Vardiya')
    const tooLong: HotelNavigationConfig = { ...config, customLabels: { roster: { tr: 'Haftalık vardiya çizelgesi' } } }
    expect(getModuleShortLabel(findModule('roster')!, 'tr', tooLong)).toBe('Vardiya')
    expect(getModuleShortLabel(notes, 'tr', config)).toBe('Notlar')
  })
})

test.describe('personal sidebar preferences', () => {
  test('applies the account order instead of the shared one', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({
      module_order: ['roster', 'sales', 'overview'],
      favorite_ids: ['roster', 'overview'],
    }))
    expect(ids(resolved.primary)).toEqual(['roster', 'overview'])
    expect(ids(resolved.sections.find((section) => section.id === 'operations')!.items)).toContain('sales')
  })

  test('empties the starred block when every star is removed', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({ module_order: ['roster', 'overview'], favorite_ids: [] }))
    expect(resolved.primary).toEqual([])
    const flattened = resolved.sections.flatMap((section) => ids(section.items))
    expect(flattened).toContain('roster')
    expect(flattened).toContain('overview')
  })

  test('stars exactly the modules the account chose', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({ module_order: ['roster', 'overview', 'sales'], favorite_ids: ['sales', 'roster'] }))
    expect(ids(resolved.primary)).toEqual(['roster', 'sales'])
    expect(resolved.sections.flatMap((section) => ids(section.items))).not.toContain('roster')
  })

  test('honours a personal section assignment', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({ module_order: ['roster', 'overview'], section_by_module: { roster: 'tools' } }))
    expect(ids(resolved.sections.find((section) => section.id === 'tools')!.items)).toContain('roster')
    expect(ids(resolved.sections.find((section) => section.id === 'today')!.items)).not.toContain('roster')
  })

  test('hides a module everywhere and keeps admin role access control intact', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({
      module_order: ['roster', 'settings', 'overview'],
      favorite_ids: ['roster', 'settings'],
      hidden_ids: ['roster', 'settings'],
    }))
    expect(resolved.all.map((item) => item.id)).not.toContain('roster')
    expect(resolved.all.map((item) => item.id)).not.toContain('settings')
    expect(ids(resolved.primary)).toEqual([])
    expect(ids(resolved.mobile)).not.toContain('roster')
  })

  test('never lets personal preferences surface a module the role cannot open', () => {
    const hiddenForRole = normalizeNavigationConfig({ ...config, roleOverlays: { receptionist: { hiddenModuleIds: ['pricing', 'settings'] } } })
    const resolved = resolvePersonalNavigation('receptionist', hiddenForRole, prefs({
      module_order: ['pricing', 'settings', 'overview'],
      favorite_ids: ['pricing', 'settings', 'overview'],
    }))
    const visible = resolved.all.map((item) => item.id)
    expect(visible).not.toContain('pricing')
    expect(visible).not.toContain('settings')
    expect(ids(resolved.primary)).toEqual(['overview'])
  })
})

test.describe('personal mobile bar', () => {
  test('uses the account selection', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({ module_order: ['sales', 'tours', 'roster', 'menu', 'blacklist'], mobile_ids: ['tours', 'sales'] }))
    expect(ids(resolved.mobile)).toEqual(['tours', 'sales'])
  })

  test('falls back to the hotel default for records saved before the field existed', () => {
    const legacy: NonNullable<UserSettings['sidebar_preferences']> = { favorite_ids: [], module_order: ['roster'], section_by_module: {} }
    const resolved = resolvePersonalNavigation('gm', config, legacy)
    expect(ids(resolved.mobile)).toEqual(config.mobileModuleIds)
  })

  test('drops slots the account no longer has and caps the bar', () => {
    const resolved = resolvePersonalNavigation('gm', config, prefs({ mobile_ids: ['sales', 'not-a-module', 'tours', 'roster', 'menu', 'blacklist'] }))
    expect(ids(resolved.mobile)).toEqual(['sales', 'tours', 'roster', 'menu'])
    expect(resolved.mobile).toHaveLength(MOBILE_SLOT_COUNT)
  })
})
