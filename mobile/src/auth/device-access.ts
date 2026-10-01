// The app's device enrollment, wired to the session and the OData client (see enrollment.ts).
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { sameOriginApi } from '@/lib/config';
import { client, getDeviceId, session } from '@/model/platform';
import { firstName, type Claims } from './claims';
import { DeviceEnrollment, type DeviceRow } from './enrollment';

function describe(claims: Claims | null) {
  const model = Device.modelName ?? undefined;
  const who = firstName(claims);
  const kind = Platform.OS === 'web' ? 'browser' : model ?? 'phone';
  return {
    platform: Platform.OS,
    ...(model ? { model: model.slice(0, 64) } : {}),
    label: (who ? `${who}'s ${kind}` : `Field app (${kind})`).slice(0, 64),
  };
}

export const enrollment = new DeviceEnrollment({
  getDeviceId,
  claims: () => session.claims,
  signedIn: () => session.signedIn,
  refresh: () => session.refresh(),
  register: body => client.create<DeviceRow>('Devices', body),
  read: id => client.get<DeviceRow>('Devices', id),
  describe,
  sendsDeviceHeader: sameOriginApi,
});

// A call refused because this phone is not bound (DeviceMismatch / DeviceNotBound) asks for access
// instead of ending the session.
session.onDeviceUnbound(() => enrollment.unbound());
