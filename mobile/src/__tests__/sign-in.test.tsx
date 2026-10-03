/* eslint-disable @typescript-eslint/no-require-imports */
// The field app's designed sign-in screens post straight to the token endpoint (direct grant):
// SM-05 → SM-06 phone + SMS code, LD-06 staff ID + PIN, DR-29 resend / voice call.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { phoneSignIn, stepFrom } from '@/auth/direct';
import { session } from './fake-platform';
import { jwt } from './helpers';

jest.mock('@/model/platform', () => require('./fake-platform'));
jest.mock('expo-local-authentication', () => ({ hasHardwareAsync: async () => false, isEnrolledAsync: async () => false, authenticateAsync: jest.fn() }));

const TOKENS = { access_token: jwt({ sub: 'u-sm', name: 'Sam Store', realm_access: { roles: ['store_manager'] }, outlet_id: 'OUT1', exp: 9999999999 }), refresh_token: 'rt', expires_in: 300 };

let answers: { status: number; body: object }[];
let posted: Record<string, string>[];

beforeEach(async () => {
  await session.signOut();
  answers = [];
  posted = [];
  phoneSignIn.set({ face: null, digits: '', step: null, sentAt: null, resendAt: null });
  globalThis.fetch = jest.fn(async (_u: unknown, init?: { body?: string }) => {
    posted.push(Object.fromEntries(new URLSearchParams(init?.body ?? '')));
    const a = answers.shift() ?? { status: 500, body: {} };
    return { ok: a.status < 300, status: a.status, json: async () => a.body } as Response;
  }) as unknown as typeof fetch;
});

const press = async (ids: string[]) => {
  for (const id of ids) await act(async () => { fireEvent.press(screen.getByTestId(id)); });
};

it('maps the flow answers (code sent with the demo code; generic refusals)', () => {
  expect(stepFrom(401, { error: 'code_sent', demo_code: '123456', resend_in: 30 })).toMatchObject({ error: 'code_sent', demoCode: '123456', resendIn: 30 });
  expect(stepFrom(401, { error: 'invalid_grant', error_description: 'Invalid user credentials' }).description).toMatch(/did not work/);
});

it('SM-05 sends a code for the typed number', async () => {
  const Sm05 = require('@/live/sm-05-sign-in').default;
  await render(<Sm05 />);
  await press('774567890'.split('').map(d => `key-${d}`));
  expect(screen.getByTestId('phone-value').props.children).toBe('77 456 7890');
  answers.push({ status: 401, body: { error: 'code_sent', method: 'sms', phone_hint: '78 90', resend_in: 30, demo_code: '482913' } });
  await press(['lk-L68']);
  await waitFor(() => expect(phoneSignIn.get().step?.demoCode).toBe('482913'));
  expect(posted[0]).toMatchObject({ grant_type: 'password', client_id: 'lodestar-field', phone: '+94774567890' });
});

it('SM-06 shows the demo code and signs in with it', async () => {
  phoneSignIn.set({ face: 'store', digits: '774567890', step: { error: 'code_sent', description: '', status: 401, demoCode: '482913' }, sentAt: Date.now(), resendAt: Date.now() + 30_000 });
  posted.push({});
  const Sm06 = require('@/live/sm-06-verify-code').default;
  await render(<Sm06 />);
  expect(screen.getByTestId('demo-code')).toBeTruthy();
  answers.push({ status: 200, body: TOKENS });
  await press('482913'.split('').map(d => `key-${d}`));
  await waitFor(() => expect(posted[1]).toMatchObject({ code: '482913' }));
  await waitFor(() => expect(session.claims?.sub).toBe('u-sm'));
  expect(posted[1]).toMatchObject({ phone: '+94774567890', code: '482913' });
});

it('SM-06 clears the boxes and says why when the code is wrong', async () => {
  phoneSignIn.set({ face: 'store', digits: '774567890', step: { error: 'code_sent', description: '', status: 401 }, sentAt: Date.now(), resendAt: Date.now() + 30_000 });
  const Sm06 = require('@/live/sm-06-verify-code').default;
  await render(<Sm06 />);
  answers.push({ status: 401, body: { error: 'invalid_grant', error_description: "That code isn't right. Check the SMS and try again." } });
  await press('111111'.split('').map(d => `key-${d}`));
  await waitFor(() => expect(screen.getByTestId('sign-in-note').props.children).toMatch(/isn't right/));
});

it('LD-06 signs in with the staff ID and the 4-digit PIN', async () => {
  const Ld06 = require('@/live/ld-06-sign-in').default;
  await render(<Ld06 />);
  await act(async () => { fireEvent.changeText(screen.getByTestId('staff-id-input'), 'kdy-0427'); });
  answers.push({ status: 401, body: { error: 'invalid_grant', error_description: 'Wrong staff ID or PIN.' } });
  await press(['key-2', 'key-4', 'key-6', 'key-8']);
  await waitFor(() => expect(posted[0]).toMatchObject({ username: 'KDY-0427', pin: '2468' }));
  await waitFor(() => expect(screen.getByTestId('sign-in-note').props.children).toBe('Wrong staff ID or PIN.'));
});

it('DR-29 asks for a voice call with the number from DR-06', async () => {
  phoneSignIn.set({ face: 'run', digits: '773456789', step: null, sentAt: Date.now() - 60_000, resendAt: Date.now() - 1 });
  const Dr29 = require('@/live/dr-29-can-t-sign-in').default;
  await render(<Dr29 />);
  answers.push({ status: 401, body: { error: 'code_sent', method: 'voice', resend_in: 30 } });
  await press(['help-sign-in']);
  await waitFor(() => expect(posted[0]).toMatchObject({ phone: '+94773456789', channel: 'voice' }));
});
