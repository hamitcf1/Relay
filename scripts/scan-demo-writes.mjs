import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'

/**
 * Finds Firestore writes that the live demo cannot perform.
 *
 * The demo signs in without a Firebase session, so its hotel id is the fixture "demo-hotel-id"
 * and the project rejects every write for it. Stores avoid that by keeping a local copy of their
 * data and checking for the demo before touching Firestore, so the check has to be on the write
 * itself, not just on the subscription next to it.
 *
 * That is exactly the part that drifts. roomStore once had ten write actions and no checks at
 * all, pricingStore and salesStore had none, and src/lib/calendar-sync.ts had never had any. In
 * the demo those writes threw permission-denied at the user. Nothing failed loudly at build time
 * and nothing failed in the real app, because the demo is the only place the condition occurs,
 * so the checks have to be enforced by a scan rather than remembered.
 *
 * What counts as a finding
 * ------------------------
 * A function that writes to Firestore, has no demo check, and can actually be called. The
 * reachability pass matters: logsStore has five unguarded writes, but nothing renders the log
 * board, so guarding them would be noise. Both the "is it guarded" and "can it be called"
 * passes are name-based, which is a real limitation. Two stores can define the same action name
 * and be misattributed, and a caller reached through a spread or a computed lookup is invisible.
 * The scan is a backstop against the obvious regression, not a proof of correctness;
 * tests/e2e/demo-write-guards.spec.ts is what actually proves the demo works.
 *
 * Run it directly for a readable report:
 *   node scripts/scan-demo-writes.mjs
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SRC = join(ROOT, 'src')
const STORES = join(SRC, 'stores')

/** Both ways the app recognises a demo session, so neither is reported as a gap. */
const GUARD = /demo-hotel-id|DEMO_HOTEL_ID|isDemoHotel|isDemoMode|DEMO_HOTEL|is_demo/

/** Firestore mutations, plus the read that deleteSale-style cleanup depends on. */
const WRITE = /doc\(db|collection\(db|collectionGroup\(db|setDoc\(|updateDoc\(|deleteDoc\(|addDoc\(|writeBatch\(|runTransaction\(|getDocs\(query/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

/** The source text of one brace-delimited function, starting just after its opening brace. */
function bodyFrom(src, openIndex) {
  let i = openIndex
  let depth = 0
  let started = false
  while (i < src.length) {
    const char = src[i]
    if (char === '{') { depth += 1; started = true } else if (char === '}') { depth -= 1 }
    i += 1
    if (started && depth === 0) return src.slice(openIndex, i)
  }
  return src.slice(openIndex)
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length
}

/**
 * Lists every unguarded, reachable Firestore write.
 *
 * Returned entries carry a `key` of "<owner>:<name>" for the exemption list in the spec, and a
 * `location` of "file:line" for the message.
 */
export function findUnguardedDemoWrites() {
  const all = walk(SRC)
  const storeFiles = readdirSync(STORES).filter((f) => f.endsWith('Store.ts'))

  // Which files import which store module. Needed because action names repeat across stores:
  // notesStore and logsStore both define togglePin, so a name search alone would credit one
  // store with the other's callers.
  const consumers = new Map()
  for (const file of all) {
    const src = readFileSync(file, 'utf8')
    for (const storeFile of storeFiles) {
      const mod = storeFile.replace(/\.ts$/, '')
      if (new RegExp(`from ['"][^'"]*/${mod}['"]`).test(src)) {
        if (!consumers.has(mod)) consumers.set(mod, new Set())
        consumers.get(mod).add(file)
      }
    }
  }

  const findings = []

  for (const storeFile of storeFiles) {
    const mod = storeFile.replace(/\.ts$/, '')
    const storePath = join(STORES, storeFile)
    const src = readFileSync(storePath, 'utf8')
    const actionPattern = /^    ([a-zA-Z][a-zA-Z0-9_]*): async \([^)]*\) => \{/gm
    let match

    while ((match = actionPattern.exec(src)) !== null) {
      const name = match[1]
      const body = bodyFrom(src, match.index + match[0].length)
      if (!WRITE.test(body) || GUARD.test(body)) continue

      const callers = [...(consumers.get(mod) ?? [])].filter(
        (file) => file !== storePath && new RegExp(`\\b${name}\\b`).test(readFileSync(file, 'utf8')),
      )
      if (!callers.length) continue

      findings.push({
        key: `${mod}:${name}`,
        location: `${relative(ROOT, storePath)}:${lineOf(src, match.index)}`,
      })
    }
  }

  // Standalone helpers outside the store objects, e.g. syncLinkedNotes in salesStore and
  // syncNoteToCalendar in src/lib. The store pass only sees members of the store object, so
  // these would otherwise be invisible.
  const helperPattern = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g
  for (const file of all) {
    if (file.startsWith(STORES)) continue
    const src = readFileSync(file, 'utf8')
    if (!/firebase\/firestore/.test(src)) continue
    let match
    while ((match = helperPattern.exec(src)) !== null) {
      const body = bodyFrom(src, match.index + match[0].length)
      if (!WRITE.test(body) || GUARD.test(body)) continue
      findings.push({
        key: relative(SRC, file).replace(/\.tsx?$/, ''),
        location: `${relative(ROOT, file)}:${lineOf(src, match.index)}`,
      })
    }
  }

  return findings
}

// Only report when executed directly, so importing the scan in a test has no side effects.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const findings = findUnguardedDemoWrites()
  if (findings.length === 0) {
    console.log('OK: every reachable Firestore write has a demo guard.')
  } else {
    console.log(`${findings.length} reachable Firestore write(s) without a demo guard:\n`)
    for (const finding of findings) {
      console.log(`  ${finding.location}  ${finding.key}`)
    }
    process.exitCode = 1
  }
}
