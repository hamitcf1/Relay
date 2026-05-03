import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Force use of Emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const app = initializeApp({ projectId: 'relay-e61b4' });
const db = getFirestore(app);
const auth = getAuth(app);

const HOTEL_ID = '6CJsikFEh3uy582YWELQ';
const STAFF = [
  { id: 'GM_1', email: 'gm1@relay.com', name: 'Caner Gece Müdürü', role: 'gm' },
  { id: 'GM_2', email: 'gm2@relay.com', name: 'Elif Genel Müdür', role: 'gm' },
  { id: 'REC_1', email: 'rec1@relay.com', name: 'Ahmet Resepsiyonist', role: 'receptionist' },
  { id: 'REC_2', email: 'rec2@relay.com', name: 'Mehmet Resepsiyonist', role: 'receptionist' },
  { id: 'HK_1', email: 'hk1@relay.com', name: 'Ayşe Kat Hizmetleri', role: 'housekeeping' },
];

async function init() {
  console.log('🚀 Initializing Emulator with STRESS Hotel...');

  try {
    // 1. Create Hotel
    await db.collection('hotels').doc(HOTEL_ID).set({
      code: 'STRESS',
      info: {
        name: 'Aetherius Stress Hotel',
        address: 'Cyber-Concierge Blvd 101',
        phone: '+90 555 123 45 67'
      },
      settings: {
        kbs_time: '23:00',
        currency: 'EUR',
        check_agency_intervals: [9, 12, 15, 18, 21]
      }
    });

    // 2. Create Auth Users & Firestore Docs
    for (const s of STAFF) {
      try {
        // Create in Auth Emulator
        await auth.createUser({
          uid: s.id,
          email: s.email,
          password: 'password123',
          displayName: s.name
        });
      } catch (e) {
        // If user already exists, just update password
        await auth.updateUser(s.id, { password: 'password123' });
      }

      // Create in Firestore
      await db.collection('users').doc(s.id).set({
        uid: s.id,
        email: s.email,
        name: s.name,
        role: s.role,
        hotel_id: HOTEL_ID
      });
    }

    // 3. Create Active Shift
    await db.collection('hotels').doc(HOTEL_ID).collection('shifts').doc('ACTIVE_STRESS_SHIFT').set({
      shift_id: 'ACTIVE_STRESS_SHIFT',
      date: '2026-05-03',
      status: 'active',
      staff_ids: STAFF.map(s => s.id)
    });

    // 4. Create Rooms
    const rooms = ['101', '102', '103', '104', '105', '201', '202', '301', '405', '501'];
    const batch = db.batch();
    for (const num of rooms) {
      const ref = db.collection('hotels').doc(HOTEL_ID).collection('rooms').doc(num);
      batch.set(ref, { number: num, status: 'clean', type: 'standard', floor: num[0] });
    }
    await batch.commit();

    console.log('✅ Success! You can now login with:');
    console.log('   Email: gm1@relay.com / Pass: password123');
    console.log('   Hotel Code: STRESS');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

init();
