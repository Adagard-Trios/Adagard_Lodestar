// k6 load test for the HPA demo on the local kind cluster
// (deploy/local/kind/scale-test.sh runs it; PLATFORM.md section 9).
//
// Drives the gateway's OData service document (GET /odata/v4/), which the
// gateway proxies to the `auth` service: every request is a full NestJS round
// trip with an RS256 JWT verification, so auth's CPU climbs and its HPA scales
// out; when the load stops it scales back in. Every 5th iteration also hits the
// gateway itself ($metadata, /healthz) so the gateway HPA sees traffic too.
//
// The bearer token is a client-credentials token of a service client with
// its DEV-ONLY docker-compose secret (Keycloak access tokens live 5 min, longer
// than the default run). Without a token the requests still load auth (401s).
//
//   k6 run -e BASE_URL=https://localhost:8443 tests/load/gateway-scale.js
//
// Env: BASE_URL, VUS (default 60), RAMP (30s), HOLD (3m), SLEEP seconds
// between requests per VU (0.05), CLIENT_ID / CLIENT_SECRET.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = (__ENV.BASE_URL || 'https://localhost:8443').replace(/\/$/, '');
const VUS = Number(__ENV.VUS || 60);
const PAUSE = Number(__ENV.SLEEP || 0.05);
const CLIENT_ID = __ENV.CLIENT_ID || 'svc-planning';
const CLIENT_SECRET = __ENV.CLIENT_SECRET || 'svc-planning-dev-only'; // dev-only default from docker-compose.yml

// 401 is an expected answer (no token / expired token), not a failed request.
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 401));

export const options = {
  insecureSkipTLSVerify: true, // the gateway's DEV ONLY self-signed certificate
  discardResponseBodies: true,
  scenarios: {
    scale_out_and_in: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP || '30s', target: VUS },
        { duration: __ENV.HOLD || '3m', target: VUS },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // 429/5xx would mean the platform (not the test) is the bottleneck
    'http_req_failed{endpoint:service_document}': ['rate<0.05'],
    'http_req_duration{endpoint:service_document}': ['p(95)<2000'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/realms/lodestar/protocol/openid-connect/token`,
    { grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
    { responseType: 'text', tags: { endpoint: 'token' } },
  );
  if (res.status === 200) {
    return { token: res.json('access_token') };
  }
  console.warn(`no access token (HTTP ${res.status}); continuing unauthenticated, auth answers 401`);
  return { token: null };
}

export default function (data) {
  const headers = data.token ? { Authorization: `Bearer ${data.token}` } : {};
  const res = http.get(`${BASE}/odata/v4/`, { headers, tags: { endpoint: 'service_document' } });
  check(res, {
    'service document served (200, or 401 without token)': (r) => r.status === 200 || (!data.token && r.status === 401),
  });

  if (__ITER % 5 === 0) {
    http.get(`${BASE}/odata/v4/$metadata`, { tags: { endpoint: 'metadata' } });
    http.get(`${BASE}/healthz`, { tags: { endpoint: 'healthz' } });
  }
  sleep(PAUSE);
}
