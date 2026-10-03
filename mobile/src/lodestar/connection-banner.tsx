// The driver's connection banner and nav pill (DR-25 Connection banner states), as reusable components.
// Driven by the phone's network state (useOnline, network.since), the outbox (waiting / synced / syncing)
// and the time the run was last saved for offline. Pass `state` to force one designed state (the DR-25 gallery).
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useStore } from '@/lib/store';
import { hm } from '@/lib/time';
import { useOnline, useOutbox } from '@/model/hooks';
import { network } from '@/offline/network';
import { Icon } from '@/lodestar/runtime';

export type ConnectionState = 'online' | 'no-signal' | 'offline-waiting' | 'sending' | 'sent';

export type Connection = {
  state: ConnectionState;
  /** When the phone went offline (or came back online). */
  since: string;
  /** Records still on the phone. */
  waiting: number;
  /** Records sent since the phone came back online. */
  sent: number;
  /** waiting + sent: the batch "sending x of y" counts through. */
  total: number;
  /** Last record synced (ISO), for "Synced 8:40". */
  lastSyncedAt?: string;
  /** When the run was last saved for offline (ISO or epoch ms). */
  savedAt?: string | number | null;
};

/** The live connection state of this phone. */
export function useConnection(savedAt?: string | number | null): Connection {
  const online = useOnline();
  const { since } = useStore(network);
  const { waiting, synced, syncing } = useOutbox();
  const sinceMs = Date.parse(since);
  const sentNow = synced.filter(i => i.syncedAt && Date.parse(i.syncedAt) >= sinceMs);
  const lastSyncedAt = synced.map(i => i.syncedAt ?? '').sort((a, b) => a.localeCompare(b)).at(-1) || undefined;
  const state: ConnectionState = !online
    ? waiting.length ? 'offline-waiting' : 'no-signal'
    : waiting.length ? 'sending' : sentNow.length && !syncing ? 'sent' : 'online';
  return { state, since, waiting: waiting.length, sent: sentNow.length, total: waiting.length + sentNow.length, lastSyncedAt, savedAt };
}

const time = (v?: string | number | null) => (v === null || v === undefined || v === '' ? '' : hm(typeof v === 'number' ? new Date(v).toISOString() : v));

function lines(c: Connection): { title: string; body?: string } {
  switch (c.state) {
    case 'online':
      return { title: time(c.savedAt) ? `Online · saved for offline ${time(c.savedAt)}` : 'Online' };
    case 'no-signal':
      return { title: 'No signal · keep going', body: 'Your run is on this phone. Nothing is lost.' };
    case 'offline-waiting':
      return { title: `No signal${time(c.since) ? ` since ${time(c.since)}` : ''} · ${c.waiting} waiting`, body: 'They send by themselves when signal returns.' };
    case 'sending':
      return { title: `Back online · sending ${Math.min(c.sent + 1, c.total)} of ${c.total}`, body: 'They send in the order they were saved.' };
    case 'sent':
      return { title: c.sent ? `All ${c.sent} records synced` : 'Everything sent' };
  }
}

/** The connection banner. Without `state` it follows the phone; with `state` it shows that designed state. */
export function ConnectionBanner({ state, savedAt, style, testID }: { state?: ConnectionState; savedAt?: string | number | null; style?: StyleProp<ViewStyle>; testID?: string }) {
  const live = useConnection(savedAt);
  const c = state ? { ...live, state } : live;
  const { title, body } = lines(c);
  const look = c.state === 'online' || c.state === 'sent' ? { box: s.v10, text: s.t8, icon: X0 } : c.state === 'sending' ? { box: s.v15, text: s.t14, icon: X3 } : { box: s.v13, text: s.t11, icon: c.state === 'no-signal' ? X1 : X2 };
  return (
    <View style={[look.box, style]} testID={testID ?? `connection-banner-${c.state}`} accessibilityRole="summary">
      <Icon xml={look.icon} width={20} height={20} style={s.v7} />
      <View style={s.v9}>
        <View>
          <Text style={look.text}>{title}</Text>
        </View>
        {body ? (
          <View>
            <Text style={s.t12}>{body}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** The matching nav pill (top bar of the driver screens). */
export function ConnectionPill({ state, style, testID }: { state?: ConnectionState; style?: StyleProp<ViewStyle>; testID?: string }) {
  const live = useConnection();
  const c = state ? { ...live, state } : live;
  const pill =
    c.state === 'online' ? { box: s.v18, text: s.t17, icon: X4, label: 'Offline-ready' }
    : c.state === 'no-signal' ? { box: s.v20, text: s.t19, icon: X5, label: 'Saved on phone' }
    : c.state === 'offline-waiting' ? { box: s.v20, text: s.t19, icon: X5, label: `${c.waiting} waiting` }
    : c.state === 'sending' ? { box: s.v22, text: s.t21, icon: X6, label: 'Sending' }
    : { box: s.v18, text: s.t17, icon: X4, label: c.lastSyncedAt ? `Synced ${hm(c.lastSyncedAt)}` : 'Synced' };
  return (
    <View style={[pill.box, style]} testID={testID ?? `connection-pill-${c.state}`}>
      <Icon xml={pill.icon} width={14} height={14} style={s.v16} />
      <Text style={pill.text} numberOfLines={1}>{pill.label}</Text>
    </View>
  );
}

const X0 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#5ee0a8\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#5ee0a8\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X1 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X2 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></circle><path d=\"M12 6v6l4 2\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X3 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#6cc4f5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 12a9 9 0 1 1-3-6.7L21 8\" fill=\"none\" stroke=\"#6cc4f5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21 3v5h-5\" fill=\"none\" stroke=\"#6cc4f5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X4 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#5ee0a8\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20 6 9 17l-5-5\" fill=\"none\" stroke=\"#5ee0a8\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X5 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20\" fill=\"none\" stroke=\"#d6cfc7\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";
const X6 = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#6cc4f5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\" width=\"14\" height=\"14\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M21 12a9 9 0 1 1-3-6.7L21 8\" fill=\"none\" stroke=\"#6cc4f5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path><path d=\"M21 3v5h-5\" fill=\"none\" stroke=\"#6cc4f5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill-opacity=\"1\" stroke-opacity=\"1\" fill-rule=\"nonzero\"></path></svg>";

const s = StyleSheet.create({
  v7: {"flexShrink":0,"marginTop":1,"overflow":"hidden"},
  t8: {"color":"#5ee0a8","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v9: {"flexDirection":"column","alignItems":"stretch","rowGap":2,"columnGap":2,"flexShrink":1},
  v10: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#0d2a20","borderRadius":18},
  t11: {"color":"#d6cfc7","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  t12: {"color":"#b5bdd1","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_400Regular"},
  v13: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"borderWidth":1,"borderColor":"#57534e","borderStyle":"dashed","borderRadius":18},
  t14: {"color":"#6cc4f5","fontSize":14,"lineHeight":20.3,"fontFamily":"Inter_700Bold"},
  v15: {"flexDirection":"row","alignItems":"flex-start","rowGap":12,"columnGap":12,"paddingTop":14,"paddingRight":16,"marginRight":16,"paddingBottom":14,"paddingLeft":16,"marginLeft":16,"backgroundColor":"#0b2233","borderRadius":18},
  v16: {"flexShrink":0,"overflow":"hidden"},
  t17: {"color":"#5ee0a8","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v18: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#0d2a20","borderRadius":14},
  t19: {"color":"#d6cfc7","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v20: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"borderWidth":1,"borderColor":"#57534e","borderStyle":"dashed","borderRadius":14},
  t21: {"color":"#6cc4f5","fontSize":13,"lineHeight":19.5,"fontFamily":"Inter_700Bold"},
  v22: {"flexDirection":"row","alignItems":"center","rowGap":6,"columnGap":6,"flexShrink":1,"paddingRight":12,"paddingLeft":12,"height":28,"backgroundColor":"#0b2233","borderRadius":14},
});
