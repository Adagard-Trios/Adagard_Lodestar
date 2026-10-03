import { HttpSmsProvider, LogSmsProvider, maskPhone, smsBody, smsConfigFromEnv, SmsService, wantsSms } from './sms';
import { NotificationsService } from './notifications.service';

describe('SMS (behind SMS_ENABLED)', () => {
  describe('config', () => {
    it('is off with the log provider by default', () => {
      const c = smsConfigFromEnv({});
      expect(c.enabled).toBe(false);
      expect(c.provider.name).toBe('log');
    });

    it('uses the HTTP provider only with a URL', () => {
      expect(smsConfigFromEnv({ SMS_ENABLED: 'true', SMS_PROVIDER: 'http', SMS_API_URL: 'https://sms.example/send' }).provider.name).toBe('http');
      expect(smsConfigFromEnv({ SMS_ENABLED: 'true', SMS_PROVIDER: 'http' }).provider.name).toBe('log');
      expect(smsConfigFromEnv({ SMS_ENABLED: '1' }).enabled).toBe(true);
    });
  });

  describe('preferences', () => {
    it.each([
      ['VEHICLE_FAULT', undefined, true], // DSP-20 default: vehicle fault SMS on
      ['VEHICLE_FAULT', { alerts: { vehicleFault: { push: true, sms: false } } }, false],
      ['PLAN_PUBLISHED', {}, true], // SM-30 arrival window SMS on by default
      ['ETA_UPDATE', {}, false],
      ['ETA_UPDATE', { notifications: { vanOnTheWay: { sms: true } } }, true],
      ['CREDIT_NOTE_ISSUED', { notifications: { creditNotes: { app: true, sms: true } } }, true],
      ['ORDER_DEFERRED', { notifications: {} }, true], // short or moved orders: locked on
      ['SHORTFALL_FLAGGED', {}, false], // push only
      ['BLACKOUT_DETECTED', { alerts: { silence: { call: true } } }, false], // no call channel
    ])('%s with %j → %p', (type, prefs, expected) => {
      expect(wantsSms(type, prefs)).toBe(expected);
    });
  });

  it('writes a short plain text and masks numbers', () => {
    expect(smsBody('VEHICLE_FAULT', { vehicleId: 'VEH057', tripId: 'T1' })).toBe("Waypoint Lodestar: Vehicle VEH057 can't depart (trip T1). Open Lodestar Plan to re-plan.");
    expect(smsBody('X_Y', null)).toBe('Waypoint Lodestar: x y');
    expect(smsBody('ORDER_DEFERRED', { orderId: 'A'.repeat(300) }).length).toBe(160);
    expect(maskPhone('+94 77 123 4567')).toBe('••••••••4567');
  });

  describe('HttpSmsProvider', () => {
    it('POSTs JSON with the API key and returns the gateway id', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '{"sid":"SM1"}' });
      const p = new HttpSmsProvider('https://sms.example/send', 'k', 'LODESTAR', fetchFn);
      await expect(p.send({ to: '+94771234567', body: 'hi' })).resolves.toEqual({ status: 'SENT', providerId: 'SM1' });
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('https://sms.example/send');
      expect(init.headers.Authorization).toBe('Bearer k');
      expect(JSON.parse(init.body)).toEqual({ to: '+94771234567', from: 'LODESTAR', body: 'hi' });
    });

    it('reports a refused or unreachable gateway as FAILED', async () => {
      const refused = new HttpSmsProvider('u', undefined, undefined, jest.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' }));
      await expect(refused.send({ to: '1', body: 'x' })).resolves.toEqual({ status: 'FAILED', error: 'HTTP 401' });
      const down = new HttpSmsProvider('u', undefined, undefined, jest.fn().mockRejectedValue(new Error('ECONNREFUSED')));
      await expect(down.send({ to: '1', body: 'x' })).resolves.toEqual({ status: 'FAILED', error: 'ECONNREFUSED' });
    });
  });

  describe('SmsService', () => {
    const n = { id: 'N1', recipientId: 'nilanthi', type: 'VEHICLE_FAULT', payload: { vehicleId: 'VEH057' } };

    it('sends nothing when the flag is off', async () => {
      const send = jest.fn();
      const svc = new SmsService({ enabled: false, provider: { name: 'log', send } });
      await expect(svc.deliver(n, { phone: '+94771234567' })).resolves.toBeNull();
      expect(send).not.toHaveBeenCalled();
    });

    it('sends nothing without a phone or when the preferences say no', async () => {
      const svc = new SmsService({ enabled: true, provider: new LogSmsProvider() });
      await expect(svc.deliver(n, { phone: null })).resolves.toBeNull();
      await expect(svc.deliver(n, { phone: '+94771234567', preferences: { alerts: { vehicleFault: { sms: false } } } })).resolves.toBeNull();
    });

    it('records what the log provider would send, in the audit log too', async () => {
      const audit = { record: jest.fn().mockResolvedValue(undefined) };
      const svc = new SmsService({ enabled: true, provider: new LogSmsProvider() }, audit);
      const d = await svc.deliver(n, { phone: '+94771234567', preferences: {} });
      expect(d).toMatchObject({ channel: 'SMS', provider: 'log', status: 'LOGGED', to: '••••••••4567' });
      expect(d?.body).toContain('VEH057');
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'Notifications.Sms', entityKey: 'N1', outcome: 'SUCCESS' }));
      expect(JSON.stringify(audit.record.mock.calls[0][0])).not.toContain('+94771234567');
    });
  });

  describe('NotificationsService.send', () => {
    const gateway = { emit: jest.fn(), dispatcherAlert: jest.fn() } as any;

    it('keeps the SMS record on the notification (payload.delivery.sms)', async () => {
      const row = { id: 'N1', recipientId: 'nilanthi', type: 'VEHICLE_FAULT', payload: { vehicleId: 'VEH057' } };
      const prisma = {
        notification: { create: jest.fn().mockResolvedValue(row), update: jest.fn(async (a: any) => ({ ...row, payload: a.data.payload })) },
        user: { findUnique: jest.fn().mockResolvedValue({ phone: '+94771234567', preferences: null }) },
      };
      const svc = new NotificationsService(prisma as any, gateway, new SmsService({ enabled: true, provider: new LogSmsProvider() }));
      const out = await svc.send({ recipientId: 'nilanthi', type: 'VEHICLE_FAULT', depot: 'KANDY', payload: row.payload });
      expect((out.payload as any).delivery.sms).toMatchObject({ status: 'LOGGED', provider: 'log' });
      expect((out.payload as any).vehicleId).toBe('VEH057');
      expect(svc.channels()).toEqual({ websocket: true, push: false, sms: true, call: false });
    });

    it('does not look the recipient up when SMS is off', async () => {
      const prisma = { notification: { create: jest.fn().mockResolvedValue({ id: 'N2', payload: {} }) }, user: { findUnique: jest.fn() } };
      const svc = new NotificationsService(prisma as any, gateway, new SmsService(smsConfigFromEnv({})));
      await svc.send({ recipientId: 'x', type: 'VEHICLE_FAULT' });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(svc.channels().sms).toBe(false);
    });

    it('never fails the in-app notification over an SMS problem', async () => {
      const row = { id: 'N3', recipientId: 'x', type: 'VEHICLE_FAULT', payload: {} };
      const prisma = { notification: { create: jest.fn().mockResolvedValue(row) }, user: { findUnique: jest.fn().mockRejectedValue(new Error('db')) } };
      const svc = new NotificationsService(prisma as any, gateway, new SmsService({ enabled: true, provider: new LogSmsProvider() }));
      await expect(svc.send({ recipientId: 'x', type: 'VEHICLE_FAULT' })).resolves.toBe(row);
    });
  });
});
