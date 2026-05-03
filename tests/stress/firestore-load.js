import http from 'k6/http';
import { check, sleep } from 'k6';

// Test Configuration
export const options = {
  // Simulate 100 concurrent receptionists
  vus: 100,
  // Run the test for 30 seconds
  duration: '30s',
  // Optional: thresholds to fail the test if performance is bad
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const PROJECT_ID = 'relay-e61b4';
// Use a fixed hotel ID for testing
const HOTEL_ID = 'STRESS_TEST_HOTEL'; 

export default function () {
  // The Firestore REST API URL for the local emulator
  // Format: http://[host]:[port]/v1/projects/[project_id]/databases/(default)/documents/[collection]
  const url = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents/hotels/${HOTEL_ID}/logs`;

  // Payload reflecting our app's Log data structure (simplified)
  const payload = JSON.stringify({
    fields: {
      message: { stringValue: 'Stress test automated log entry' },
      authorName: { stringValue: 'K6 Tester' },
      createdAt: { timestampValue: new Date().toISOString() },
      category: { stringValue: 'GENERAL' },
      priority: { stringValue: 'NORMAL' },
      status: { stringValue: 'ACTIVE' },
      hotel_id: { stringValue: HOTEL_ID }
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Note: In emulator, we don't necessarily need a valid Auth token 
      // unless Security Rules explicitly demand it and are enforced.
      // If rules block this, we either:
      // 1. Temporarily allow read/write in emulator rules
      // 2. Generate a custom token and pass it here.
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    // Error 403 means Security Rules blocked it or project ID mismatch
    'not forbidden (403)': (r) => r.status !== 403, 
  });

  // Wait a little before the next request by this virtual user
  sleep(1);
}
