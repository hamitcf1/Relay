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
