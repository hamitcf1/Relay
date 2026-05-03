import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

const PROJECT_ID = 'relay-e61b4';
const HOTEL_ID = '6CJsikFEh3uy582YWELQ'; 
const BASE_URL = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DATE_TODAY = '2026-05-03';

const STAFF = [
  { id: 'GM_1', name: 'Caner Gece Müdürü', role: 'gm' },
  { id: 'GM_2', name: 'Elif Genel Müdür', role: 'gm' },
  { id: 'REC_1', name: 'Ahmet Resepsiyonist', role: 'receptionist' },
];

const ROOMS = ['101', '102', '103', '104', '105'];
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function setup() {
  const params = { headers: { 'Content-Type': 'application/json' } };
  // Ensure Hotel
  http.patch(`${BASE_URL}/hotels/${HOTEL_ID}`, JSON.stringify({
    fields: { code: { stringValue: 'STRESS' }, info: { mapValue: { fields: { name: { stringValue: 'Stress testers Hotel' } } } } }
  }), params);
}

export default function () {
  const staff = randomItem(STAFF);
  const actionType = Math.random();
  const hotelPath = `${BASE_URL}/hotels/${HOTEL_ID}`;
  const params = { headers: { 'Content-Type': 'application/json' } };

  // SCENARIO 1: Announcements (Double Post to Trigger Banner AND Modal)
  if (actionType < 0.20 && staff.role === 'gm') {
    const content = `IMPORTANT: ${randomItem(['Staff meeting at 4 PM', 'New safety protocols', 'VIP Guest arriving'])}`;
    
    // Post to Notifications (Triggers Modal)
    http.post(`${hotelPath}/notifications`, JSON.stringify({
      fields: { 
        type: { stringValue: 'announcement' }, 
        title: { stringValue: 'SYSTEM BROADCAST' }, 
        content: { stringValue: content }, 
        timestamp: { timestampValue: new Date().toISOString() }, 
        is_read: { booleanValue: false },
        target_role: { stringValue: 'all' }
      }
    }), params);

    // Post to Messages (Triggers Banner)
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
  else if (actionType < 0.40) {
    http.post(`${hotelPath}/sales`, JSON.stringify({
      fields: { type: { stringValue: 'tour' }, name: { stringValue: 'Tour' }, total_price: { doubleValue: 100 }, created_at: { timestampValue: new Date().toISOString() }, created_by_name: { stringValue: staff.name } }
    }), params);
  }
  // SCENARIO 3: Logs
  else {
    http.post(`${hotelPath}/logs`, JSON.stringify({
      fields: { content: { stringValue: 'Activity log entry' }, created_by_name: { stringValue: staff.name }, created_at: { timestampValue: new Date().toISOString() }, status: { stringValue: 'open' } }
    }), params);
  }

  sleep(Math.random() * 1.5 + 0.5);
}
