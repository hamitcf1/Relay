export const FIXTURE_ITEMS = [
    'hand_towel',
    'bath_towel',
    'bed_sheet',
    'pillow_case',
    'duvet_cover',
    'bathrobe',
    'mattress_protector'
] as const

export type FixtureItem = typeof FIXTURE_ITEMS[number]

export const MINIBAR_ITEMS = [
    'cola',
    'cola_zero',
    'fanta',
    'sprite',
    'soda'
] as const

export type MinibarItem = typeof MINIBAR_ITEMS[number]
