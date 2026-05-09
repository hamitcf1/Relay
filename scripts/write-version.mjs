import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const file = 'public/version.json'
mkdirSync(dirname(file), { recursive: true })
writeFileSync(file, JSON.stringify({ version: Date.now() }))
