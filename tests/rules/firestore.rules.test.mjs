/**
 * Firestore security rules tests.
 *
 * These run against the Firestore emulator, not the real project. They exist because the
 * rules file cannot be verified by TypeScript or by the Playwright suite: a rule that denies
 * a legitimate write, or allows one it should not, is invisible until it reaches production.
 *
 * Run with: npm run test:rules
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const HOTEL_A = 'hotelA'
const HOTEL_B = 'hotelB'
const GM_A = 'gmA'
const GM_B = 'gmB'
const REC_A = 'recA'
const FRESH_GM = 'freshGm'

let passed = 0
const failures = []

async function check(name, fn) {
    try {
        await fn()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        failures.push({ name, error })
        console.log(`FAIL  ${name}\n      ${error.message.split('\n')[0]}`)
    }
}

const testEnv = await initializeTestEnvironment({
    projectId: 'relay-rules-test',
    firestore: { rules: readFileSync(join(root, 'firestore.rules'), 'utf8') },
})

// Seed two competing hotels so every cross-tenant case is a real, populated attempt.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()

    await setDoc(doc(db, 'users', GM_A), { name: 'GM A', role: 'gm', hotel_id: HOTEL_A, status: 'active' })
    await setDoc(doc(db, 'users', GM_B), { name: 'GM B', role: 'gm', hotel_id: HOTEL_B, status: 'active' })
    await setDoc(doc(db, 'users', REC_A), { name: 'Reception A', role: 'receptionist', hotel_id: HOTEL_A, status: 'active' })
    // Signed up as a manager but has not created a hotel yet.
    await setDoc(doc(db, 'users', FRESH_GM), { name: 'Fresh GM', role: 'gm', hotel_id: null, status: 'active' })

    await setDoc(doc(db, 'hotels', HOTEL_A), { owner_id: GM_A, name: 'Hotel A', settings: {} })
    await setDoc(doc(db, 'hotels', HOTEL_B), { owner_id: GM_B, name: 'Hotel B', settings: {} })

    for (const hotel of [HOTEL_A, HOTEL_B]) {
        // Each hotel's records are owned by that hotel's own manager, so a cross-tenant
        // attempt is never accidentally legitimate via the creator branch.
        const owner = hotel === HOTEL_A ? GM_A : GM_B
        await setDoc(doc(db, 'hotels', hotel, 'pricing', 'config'), { base: 100 })
        await setDoc(doc(db, 'hotels', hotel, 'pricing', 'config', 'agencies', 'agency1'), { name: 'Agency' })
        await setDoc(doc(db, 'hotels', hotel, 'pricing', 'config', 'base_overrides', 'ov1'), { room: '101' })
        await setDoc(doc(db, 'hotels', hotel, 'rooms', '101'), { number: '101', status: 'clean' })
        await setDoc(doc(db, 'hotels', hotel, 'settings', 'info'), { secret_info: { safe_info: 'vault' } })
        await setDoc(doc(db, 'hotels', hotel, 'tours', 't1'), { name: 'Tour' })
        await setDoc(doc(db, 'hotels', hotel, 'sales', 's1'), { created_by: owner })
        await setDoc(doc(db, 'hotels', hotel, 'shift_notes', 'n1'), { created_by: owner })
    }
})

const asUser = (uid) => testEnv.authenticatedContext(uid).firestore()
const asAnon = () => testEnv.unauthenticatedContext().firestore()

console.log('\nfirestore rules\n')

// --- The regression this whole pass exists for -------------------------------------------
// Before the fix these six writes were `isGM()` with no hotel check, so any manager could
// silently overwrite another hotel's data and the write would succeed.
const crossTenantWrites = [
    ['pricing', () => setDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'pricing', 'config'), { base: 0 })],
    // Nested pricing subcollections, using the exact paths pricingStore writes to
    // (hotels/{id}/pricing/config/agencies/{id}). Document paths must alternate
    // collection/document, so the depth has to be even to be a real document.
    ['pricing subcollection: agencies', () => setDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'pricing', 'config', 'agencies', 'agency1'), { name: 'x' })],
    ['pricing subcollection: base_overrides', () => setDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'pricing', 'config', 'base_overrides', 'ov1'), { room: '101' })],
    ['rooms', () => updateDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'rooms', '101'), { status: 'dirty' })],
    ['settings (secret vault)', () => setDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'settings', 'info'), { secret_info: { safe_info: 'stolen' } })],
    ['tours', () => updateDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'tours', 't1'), { name: 'hijacked' })],
    ['daily_menu', () => setDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'daily_menu', 'today'), { lunch: 'free' })],
    ['sales delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'sales', 's1'))],
    ['shift_notes delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'shift_notes', 'n1'))],
    ['shifts delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'shifts', 'any'))],
    ['logs delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'logs', 'any'))],
    ['incidents delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'incidents', 'any'))],
    ['anonymous_feedback delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'anonymous_feedback', 'any'))],
    ['scores delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B, 'scores', 'any'))],
    ['other hotel delete', () => deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_B))],
]

for (const [label, attempt] of crossTenantWrites) {
    await check(`GM of hotel A cannot write hotel B: ${label}`, () => assertFails(attempt()))
}

await check('GM of hotel A still writes their own hotel pricing', () =>
    assertSucceeds(setDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'pricing', 'config'), { base: 250 })))
await check('GM of hotel A still writes their own pricing subcollections', () =>
    assertSucceeds(setDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'pricing', 'config', 'agencies', 'agency1'), { name: 'Renamed Agency' })))
await check('GM of hotel A still writes their own hotel rooms', () =>
    assertSucceeds(updateDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'rooms', '101'), { status: 'dirty' })))
await check('GM of hotel A still updates their own hotel doc', () =>
    assertSucceeds(updateDoc(doc(asUser(GM_A), 'hotels', HOTEL_A), { name: 'Hotel A Renamed' })))

// --- A manager with no hotel must be inert -----------------------------------------------
// ownsNothing() is the guard that stops two hotel-less accounts from satisfying (null == null).
await check('GM with no hotel cannot write any hotel pricing', () =>
    assertFails(setDoc(doc(asUser(FRESH_GM), 'hotels', HOTEL_A, 'pricing', 'config'), { base: 0 })))
await check('GM with no hotel cannot read another hotel secret vault', () =>
    assertFails(getDoc(doc(asUser(FRESH_GM), 'hotels', HOTEL_B, 'settings', 'info'))))

// --- Signup paths -------------------------------------------------------------------------
await check('a receptionist may self-register with a hotel_id', () =>
    assertSucceeds(setDoc(doc(asUser('newRec'), 'users', 'newRec'), {
        role: 'receptionist', hotel_id: HOTEL_A, current_shift_type: null,
    })))
await check('a manager may self-register to create their own hotel (no hotel_id yet)', () =>
    assertSucceeds(setDoc(doc(asUser('newGm'), 'users', 'newGm'), {
        role: 'gm', hotel_id: null, current_shift_type: null,
    })))
await check('but cannot self-register as GM into an existing hotel', () =>
    assertFails(setDoc(doc(asUser('sneaky'), 'users', 'sneaky'), {
        role: 'gm', hotel_id: HOTEL_B, current_shift_type: null,
    })))
await check('cannot self-register with a role outside the whitelist', () =>
    assertFails(setDoc(doc(asUser('fake'), 'users', 'fake'), { role: 'admin', hotel_id: null })))
await check('a GM cannot create a user inside another hotel', () =>
    assertFails(setDoc(doc(asUser(GM_A), 'users', 'intruder'), { role: 'gm', hotel_id: HOTEL_B })))

// --- Hotel creation must be self-owned -----------------------------------------------------
await check('a hotel can be created under your own uid', () =>
    assertSucceeds(setDoc(doc(asUser('newGm'), 'hotels', 'hotelC'), { owner_id: 'newGm', name: 'Hotel C' })))
await check('a hotel cannot be created claiming someone else as owner', () =>
    assertFails(setDoc(doc(asUser('newGm'), 'hotels', 'hotelD'), { owner_id: GM_B, name: 'Hotel D' })))

// --- Role changes stay inside the hotel ----------------------------------------------------
await check('a GM can change a role in their own hotel', () =>
    assertSucceeds(updateDoc(doc(asUser(GM_A), 'users', REC_A), { role: 'housekeeping' })))
await check('a GM cannot change a role in another hotel', () =>
    assertFails(updateDoc(doc(asUser(GM_A), 'users', GM_B), { role: 'receptionist' })))
await check('a receptionist cannot escalate their own role', () =>
    assertFails(updateDoc(doc(asUser(REC_A), 'users', REC_A), { role: 'gm' })))
await check('a receptionist cannot delete another user', () =>
    assertFails(deleteDoc(doc(asUser(REC_A), 'users', GM_A))))
await check('a GM cannot delete a user of another hotel', () =>
    assertFails(deleteDoc(doc(asUser(GM_A), 'users', GM_B))))

// --- Non-GM writes that were always allowed must stay allowed -----------------------------
await check('receptionist writes their own shift note', () =>
    assertSucceeds(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'shift_notes', 'n2'), { content: 'hello' })))
await check('receptionist adds a sale', () =>
    assertSucceeds(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'sales', 's2'), { total: 10 })))
await check('receptionist creates a personal note', () =>
    assertSucceeds(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'personal_notes', 'p1'), {
        owner_id: REC_A, collaborator_ids: [], title: 'mine', content: 'x',
    })))
await check('receptionist cannot write pricing', () =>
    assertFails(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'pricing', 'config'), { base: 0 })))
await check('receptionist cannot read the staff roster query', () =>
    assertFails(getDocs(query(collection(asUser(REC_A), 'users'), where('hotel_id', '==', HOTEL_B)))))

// --- Announcements keep their per-person receipt model -------------------------------------
await check('GM publishes an announcement', () =>
    assertSucceeds(setDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'announcements', 'a1'), {
        createdBy: GM_A, content: 'shift change', audience: 'all', recipientIds: [],
    })))
await check('a staff member writes their own read receipt', () =>
    assertSucceeds(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`), {
        announcementId: 'a1', uid: REC_A, state: 'seen',
    })))
await check('a staff member cannot forge a receipt for someone else', () =>
    assertFails(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${GM_A}`), {
        announcementId: 'a1', uid: GM_A, state: 'seen',
    })))
await check('a staff member cannot put a receipt in another hotel', () =>
    assertFails(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_B, 'announcement_receipts', `a1__${REC_A}`), {
        announcementId: 'a1', uid: REC_A, state: 'seen',
    })))
await check('a staff member cannot smuggle extra fields into their own receipt', () =>
    assertFails(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`), {
        announcementId: 'a1', uid: REC_A, state: 'seen', sneaky: true,
    })))
await check('a staff member cannot read a colleague receipt', () =>
    assertFails(getDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${GM_A}`))))
await check('a GM can read the whole audience of their own hotel', () =>
    assertSucceeds(getDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`))))
await check('a GM cannot read another hotel audience', () =>
    assertFails(getDoc(doc(asUser(GM_B), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`))))
await check('a staff member cannot edit the announcement body', () =>
    assertFails(updateDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcements', 'a1'), { content: 'edited' })))
await check('a GM of another hotel cannot publish into this hotel', () =>
    assertFails(setDoc(doc(asUser(GM_B), 'hotels', HOTEL_A, 'announcements', 'a2'), {
        createdBy: GM_B, content: 'x', audience: 'all', recipientIds: [],
    })))
// Withdrawing and restoring are the only announcement edits the GM may make. This is the
// path that must keep working: an allow-rule that errors is silently a deny in production.
await check('a GM can withdraw an announcement', () =>
    assertSucceeds(updateDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'announcements', 'a1'), {
        recalledAt: new Date(), recalledByName: 'GM A',
    })))
await check('a GM can restore a withdrawn announcement', () =>
    assertSucceeds(updateDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'announcements', 'a1'), {
        recalledAt: null, recalledByName: null,
    })))
await check('a GM can permanently purge an announcement', () =>
    assertSucceeds(deleteDoc(doc(asUser(GM_A), 'hotels', HOTEL_A, 'announcements', 'a1'))))
await check('a staff member cannot withdraw an announcement', () =>
    assertFails(setDoc(doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcements', 'a3'), {
        createdBy: REC_A, content: 'x', audience: 'all', recipientIds: [],
    })))

// These two are the exact queries announcementStore runs, and they are the whole read receipt
// feature. They are here because this used to be broken in a way nothing caught: receipts were a
// subcollection of each announcement and read back with a collection group query, which Firestore
// denies outright, because for a collection group the hotel in the path is a wildcard and a rule
// scoped to one hotel cannot be shown to hold. The denial was silent, the store stayed empty, and
// every announcement looked unread to every person in every real hotel, forever.
// Re-opening an announcement goes through a transaction that rewrites only the state, because
// seenAt must stay at the first opening. So the rule has to accept a write that carries no seenAt
// on a receipt that already has one, which is a narrower document than the create above.
await check('a person can update only the state of a receipt they already have', () =>
    assertSucceeds(setDoc(
        doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`),
        { announcementId: 'a1', uid: REC_A, state: 'dismissed' },
        { merge: true },
    )))
await check('a person can record that they acknowledged a withdrawal', () =>
    assertSucceeds(setDoc(
        doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`),
        { recalledAckAt: new Date() },
        { merge: true },
    )))
// Without this, clearing a field could drop announcementId and the receipt would no longer be
// findable by the audience query, silently detaching it from the announcement it belongs to.
await check('a person cannot overwrite the announcementId of their own receipt', () =>
    assertFails(setDoc(
        doc(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts', `a1__${REC_A}`),
        { announcementId: 'someone-elses-announcement', state: 'seen' },
        { merge: true },
    )))

await check('a person can list their own receipts with the query the app runs', () =>
    assertSucceeds(getDocs(query(
        collection(asUser(REC_A), 'hotels', HOTEL_A, 'announcement_receipts'),
        where('uid', '==', REC_A),
    ))))

await check('a GM can list one announcement audience with the query the app runs', () =>
    assertSucceeds(getDocs(query(
        collection(asUser(GM_A), 'hotels', HOTEL_A, 'announcement_receipts'),
        where('announcementId', '==', 'a1'),
    ))))

// A GM must not be able to read another hotel's audience by asking for their own receipts either.
await check('a GM cannot list another hotel receipts', () =>
    assertFails(getDocs(query(
        collection(asUser(GM_B), 'hotels', HOTEL_A, 'announcement_receipts'),
        where('uid', '==', REC_A),
    ))))

// --- Unauthenticated -------------------------------------------------------------------------
await check('anonymous cannot write pricing', () =>
    assertFails(setDoc(doc(asAnon(), 'hotels', HOTEL_A, 'pricing', 'config'), { base: 0 })))
await check('anonymous cannot read a hotel secret vault', () =>
    assertFails(getDoc(doc(asAnon(), 'hotels', HOTEL_A, 'settings', 'info'))))

await testEnv.cleanup()

console.log(`\n${passed} passed, ${failures.length} failed\n`)
if (failures.length) {
    for (const f of failures) console.error(`--- ${f.name}\n${f.error.message}\n`)
    process.exit(1)
}
