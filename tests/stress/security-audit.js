import http from 'k6/http';
import { check } from 'k6';

const HOTEL_ID = '6CJsikFEh3uy582YWELQ'; 
const BASE_URL = `http://127.0.0.1:8080/v1/projects/relay-e61b4/databases/(default)/documents`;

export default function () {
  const params = { headers: { 'Content-Type': 'application/json' } };

  // TEST 1: Unauthorized settings change (GM ONLY)
  // Trying to change settings as a generic staff (mocking the REST call)
  let res1 = http.patch(`${BASE_URL}/hotels/${HOTEL_ID}/settings/default`, JSON.stringify({
    fields: { fixture_prices: { mapValue: { fields: { 'Hacked': { integerValue: 0 } } } } }
  }), params);

  check(res1, {
    'Security: Non-GM cannot change settings (403)': (r) => r.status === 403,
  });

  // TEST 2: Cross-Hotel Data Leak
  // Trying to read logs of another hotel
  let res2 = http.get(`${BASE_URL}/hotels/OTHER_HOTEL_ID/logs`, params);
  check(res2, {
    'Security: Cannot read other hotel logs (403)': (r) => r.status === 403,
  });

  // TEST 3: Unauthorized Feedback Read
  // Only GMs should see anonymous feedback
  let res3 = http.get(`${BASE_URL}/hotels/${HOTEL_ID}/anonymous_feedback`, params);
  check(res3, {
    'Security: Only GM can read anonymous feedback (403)': (r) => r.status === 403,
  });
}
