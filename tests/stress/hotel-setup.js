import http from 'k6/http';

export const options = { vus: 1, iterations: 1 };

const PROJECT_ID = 'relay-e61b4';
const HOTEL_ID = '6CJsikFEh3uy582YWELQ'; 
const BASE_URL = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const STAFF = [
  { id: 'GM_1', name: 'Caner Gece Müdürü', role: 'gm' },
  { id: 'GM_2', name: 'Elif Genel Müdür', role: 'gm' },
  { id: 'REC_1', name: 'Ahmet Resepsiyonist', role: 'receptionist' },
  { id: 'REC_2', name: 'Mehmet Resepsiyonist', role: 'receptionist' },
  { id: 'HK_1', name: 'Ayşe Kat Hizmetleri', role: 'housekeeping' },
];

const ROOMS = ['101', '102', '103', '104', '105', '201', '202', '301', '405', '501'];

export default function () {
  const params = { headers: { 'Content-Type': 'application/json' } };
  
  // Helper to create document using POST (guarantees physical existence)
  const createDoc = (parentPath, docId, fields) => {
    const url = `${BASE_URL}/${parentPath}?documentId=${docId}`;
    return http.post(url, JSON.stringify({ fields }), params);
  };

  console.log('--- FORCING PHYSICAL RESTORE ---');

  // 1. Create Hotel Document
  const hotelFields = {
    code: { stringValue: 'STRESS' },
    info: { mapValue: { fields: { 
      name: { stringValue: 'Aetherius Stress Hotel' },
      address: { stringValue: 'Cyber-Concierge Blvd 101' }
    } } },
    settings: { mapValue: { fields: { 
      kbs_time: { stringValue: '23:00' },
      check_agency_intervals: { arrayValue: { values: [{ integerValue: 9 }, { integerValue: 12 }, { integerValue: 15 }] } },
      fixture_prices: { mapValue: { fields: { 'bath_towel': { integerValue: 515 }, 'bathrobe': { integerValue: 1000 } } } }
    } } }
  };
  createDoc('hotels', HOTEL_ID, hotelFields);

  // 2. Create Active Shift
  const shiftFields = {
    shift_id: { stringValue: 'ACTIVE_STRESS_SHIFT' },
    date: { stringValue: '2026-05-03' },
    status: { stringValue: 'active' },
    staff_ids: { arrayValue: { values: STAFF.map(s => ({ stringValue: s.id })) } }
  };
  createDoc(`hotels/${HOTEL_ID}/shifts`, 'ACTIVE_STRESS_SHIFT', shiftFields);

  // 3. Create Staff Users
  for (const s of STAFF) {
    const userFields = {
      uid: { stringValue: s.id },
      name: { stringValue: s.name },
      role: { stringValue: s.role },
      hotel_id: { stringValue: HOTEL_ID }
    };
    createDoc('users', s.id, userFields);
  }

  // 4. Create Rooms
  for (const num of ROOMS) {
    const roomFields = {
      number: { stringValue: num },
      status: { stringValue: 'clean' },
      type: { stringValue: 'standard' }
    };
    createDoc(`hotels/${HOTEL_ID}/rooms`, num, roomFields);
  }

  console.log('--- ALL DOCUMENTS CREATED PHYSICALLY ---');
}
