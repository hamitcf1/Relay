import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 60,
  duration: '120s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

const PROJECT_ID = 'relay-e61b4';
const HOTEL_ID = '6CJsikFEh3uy582YWELQ'; 
const SHIFT_ID = 'ACTIVE_STRESS_SHIFT';
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

export default function () {
  const staff = randomItem(STAFF);
  const actionType = Math.random();
  const hotelPath = `${BASE_URL}/hotels/${HOTEL_ID}`;
  const params = { headers: { 'Content-Type': 'application/json' } };

  // SCENARIO 1: Announcements (Double Post for Banner AND Modal)
  if (actionType < 0.15 && staff.role === 'gm') {
    const content = `URGENT: ${randomItem(['Staff meeting at 5PM', 'VIP check-in soon', 'Check Room 301 leakage'])}`;
    
    // 1. Post to Notifications (Triggers Modal)
    http.post(`${hotelPath}/notifications`, JSON.stringify({
      fields: { 
        type: { stringValue: 'announcement' }, 
        title: { stringValue: 'BROADCAST' }, 
        content: { stringValue: content }, 
        timestamp: { timestampValue: new Date().toISOString() }, 
        is_read: { booleanValue: false },
        target_role: { stringValue: 'all' }
      }
    }), params);

    // 2. Post to Messages (Triggers Banner)
    http.post(`${hotelPath}/messages`, JSON.stringify({
      fields: { 
        sender_id: { stringValue: staff.id }, 
        sender_name: { stringValue: staff.name }, 
        receiver_id: { stringValue: 'all' }, 
        content: { stringValue: content }, 
        timestamp: { timestampValue: new Date().toISOString() }, 
        is_read: { booleanValue: false } 
      }
    }), params);
  }
  // SCENARIO 2: Sales
  else if (actionType < 0.30) {
    http.post(`${hotelPath}/sales`, JSON.stringify({
      fields: { 
        type: { stringValue: 'tour' }, 
        name: { stringValue: 'Tour Package' }, 
        total_price: { doubleValue: 120 }, 
        shift_id: { stringValue: SHIFT_ID },
        date: { stringValue: DATE_TODAY },
        created_at: { timestampValue: new Date().toISOString() }, 
        created_by_name: { stringValue: staff.name } 
      }
    }), params);
  }
  // SCENARIO 3: Room Status
  else if (actionType < 0.45) {
    const room = randomItem(ROOMS);
    http.patch(`${hotelPath}/rooms/${room}?updateMask.fieldPaths=status`, JSON.stringify({
      fields: { status: { stringValue: randomItem(['clean', 'dirty', 'inspect']) } }
    }), params);
  }
  // SCENARIO 4: Logs (Primary Traffic)
  else {
    http.post(`${hotelPath}/logs`, JSON.stringify({
      fields: { 
        content: { stringValue: `Log: ${randomItem(['Guest requested towel', 'Minibar checked', 'Late check-out handled'])}` }, 
        created_by_name: { stringValue: staff.name }, 
        created_at: { timestampValue: new Date().toISOString() }, 
        status: { stringValue: 'open' },
        shift_id: { stringValue: SHIFT_ID },
        date: { stringValue: DATE_TODAY }
      }
    }), params);
  }

  sleep(Math.random() * 1.5 + 0.5);
}
