import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 60, // Good balance for a deep simulation
  duration: '120s', // Longer duration to fill all UI components
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

const PROJECT_ID = 'relay-e61b4';
const HOTEL_ID = '6CJsikFEh3uy582YWELQ'; 
const CURRENT_SHIFT_ID = 'ACTIVE_STRESS_SHIFT';
const BASE_URL = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DATE_TODAY = '2026-05-03';

const STAFF = [
  { id: 'GM_1', name: 'Caner Gece Müdürü', role: 'gm' },
  { id: 'GM_2', name: 'Elif Genel Müdür', role: 'gm' },
  { id: 'REC_1', name: 'Ahmet Resepsiyonist', role: 'receptionist' },
  { id: 'HK_1', name: 'Ayşe Kat Hizmetleri', role: 'housekeeping' },
  { id: 'REC_2', name: 'Mehmet Resepsiyonist', role: 'receptionist' },
];

const ROOMS = ['101', '102', '103', '104', '105', '201', '202', '301', '405', '501'];
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function setup() {
  const params = { headers: { 'Content-Type': 'application/json' } };
  console.log('--- MASTER SETUP: SIMULATING FULL HOTEL ---');
  
  // 1. Ensure Hotel & Active Shift
  http.patch(`${BASE_URL}/hotels/${HOTEL_ID}`, JSON.stringify({
    fields: { code: { stringValue: 'STRESS' }, info: { mapValue: { fields: { name: { stringValue: 'Stress testers Hotel' } } } } }
  }), params);

  // 2. Initialize Rooms
  ROOMS.forEach(num => {
    http.patch(`${BASE_URL}/hotels/${HOTEL_ID}/rooms/${num}`, JSON.stringify({
      fields: { number: { stringValue: num }, status: { stringValue: 'clean' }, type: { stringValue: 'standard' } }
    }), params);
  });

  // 3. Create Users
  STAFF.forEach(s => {
    http.patch(`${BASE_URL}/users/${s.id}`, JSON.stringify({
      fields: { uid: { stringValue: s.id }, name: { stringValue: s.name }, role: { stringValue: s.role }, hotel_id: { stringValue: HOTEL_ID } }
    }), params);
  });
}

export default function () {
  const staff = randomItem(STAFF);
  const actionType = Math.random();
  const hotelPath = `${BASE_URL}/hotels/${HOTEL_ID}`;
  const params = { headers: { 'Content-Type': 'application/json' } };

  // SCENARIO 1: Messages & Announcements (15%)
  if (actionType < 0.15) {
    const isAnnouncement = Math.random() > 0.7;
    if (isAnnouncement && staff.role === 'gm') {
      http.post(`${hotelPath}/notifications`, JSON.stringify({
        fields: { type: { stringValue: 'announcement' }, title: { stringValue: 'GENEL DUYURU' }, content: { stringValue: 'Lütfen yeni vardiya kurallarına uyunuz.' }, timestamp: { timestampValue: new Date().toISOString() }, is_read: { booleanValue: false } }
      }), params);
    } else {
      http.post(`${hotelPath}/messages`, JSON.stringify({
        fields: { sender_id: { stringValue: staff.id }, sender_name: { stringValue: staff.name }, content: { stringValue: 'Selam, yardıma ihtiyacım var.' }, timestamp: { timestampValue: new Date().toISOString() }, is_read: { booleanValue: false } }
      }), params);
    }
  }
  // SCENARIO 2: Sales & Tours (15%)
  else if (actionType < 0.30) {
    http.post(`${hotelPath}/sales`, JSON.stringify({
      fields: { type: { stringValue: 'tour' }, name: { stringValue: 'Bosphorus Cruise' }, customer_name: { stringValue: 'Guest X' }, total_price: { doubleValue: 150 }, currency: { stringValue: 'EUR' }, created_at: { timestampValue: new Date().toISOString() }, created_by_name: { stringValue: staff.name } }
    }), params);
  }
  // SCENARIO 3: Room Status Update (10%)
  else if (actionType < 0.40) {
    const room = randomItem(ROOMS);
    http.patch(`${hotelPath}/rooms/${room}`, JSON.stringify({
      fields: { status: { stringValue: randomItem(['clean', 'dirty', 'inspect']) } }
    }), params);
  }
  // SCENARIO 4: Complaints & Requests (10%)
  else if (actionType < 0.50) {
    const isComplaint = Math.random() > 0.5;
    if (isComplaint) {
      http.post(`${hotelPath}/anonymous_feedback`, JSON.stringify({
        fields: { content: { stringValue: 'Klimadan ses geliyor.' }, status: { stringValue: 'new' }, timestamp: { timestampValue: new Date().toISOString() } }
      }), params);
    } else {
      http.post(`${hotelPath}/off_day_requests`, JSON.stringify({
        fields: { staff_name: { stringValue: staff.name }, reason: { stringValue: 'Özel izin talebi' }, status: { stringValue: 'pending' }, date: { stringValue: '2026-06-01' } }
      }), params);
    }
  }
  // SCENARIO 5: Daily Menu Update (GM Only) (10%)
  else if (actionType < 0.60 && staff.role === 'gm') {
    http.patch(`${hotelPath}/daily_menu/${DATE_TODAY}`, JSON.stringify({
      fields: { menu: { stringValue: `Simulated Menu: ${randomItem(['Köfte - Pilav', 'Tavuk Izgara', 'Sebze Yemeği'])}` }, updated_by_name: { stringValue: staff.name }, updated_at: { timestampValue: new Date().toISOString() } }
    }), params);
  }
  // SCENARIO 6: Calendar Events (10%)
  else if (actionType < 0.70) {
    http.post(`${hotelPath}/calendar_events`, JSON.stringify({
      fields: { title: { stringValue: 'Grup Girişi (40 Kişi)' }, date: { timestampValue: new Date().toISOString() }, description: { stringValue: 'Check-in işlemlerini hızlandırın.' } }
    }), params);
  }
  // SCENARIO 7: Logs & Notes (Main Traffic) (30%)
  else {
    http.post(`${hotelPath}/logs`, JSON.stringify({
      fields: { content: { stringValue: 'Guest request handled.' }, created_by_name: { stringValue: staff.name }, created_at: { timestampValue: new Date().toISOString() }, status: { stringValue: 'open' } }
    }), params);
  }

  sleep(Math.random() * 2 + 1);
}
