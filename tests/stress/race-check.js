import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20, // 20 users hitting exactly the same document
  iterations: 100,
};

const HOTEL_ID = '6CJsikFEh3uy582YWELQ'; 
const BASE_URL = `http://127.0.0.1:8080/v1/projects/relay-e61b4/databases/(default)/documents`;

export default function () {
  const params = { headers: { 'Content-Type': 'application/json' } };
  
  // Everyone tries to set room 101 to a different status at the same time
  const status = __VU % 2 === 0 ? 'dirty' : 'clean';
  
  let res = http.patch(`${BASE_URL}/hotels/${HOTEL_ID}/rooms/101`, JSON.stringify({
    fields: { status: { stringValue: status } }
  }), params);

  check(res, {
    'Race: Update successful': (r) => r.status === 200,
  });
}
