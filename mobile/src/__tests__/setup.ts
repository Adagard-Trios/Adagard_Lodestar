// Jest setup: native modules the screens touch, replaced by small fakes.
/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-secure-store', () => {
  const m = new Map<string, string>();
  return {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0,
    getItemAsync: jest.fn(async (k: string) => m.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void m.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void m.delete(k)),
  };
});
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Box = (p: { children?: unknown }) => React.createElement(View, null, p.children);
  const Nothing = () => null;
  return { __esModule: true, default: Box, Svg: Box, SvgXml: Nothing, Defs: Nothing, LinearGradient: Nothing, RadialGradient: Nothing, Rect: Nothing, Stop: Nothing };
});
// The device cache (SQLite on phones) as an in-memory map.
jest.mock('@/lib/kv', () => {
  const m = new Map<string, string>();
  const kv = {
    get: async (k: string) => m.get(k) ?? null,
    set: async (k: string, v: string) => void m.set(k, v),
    remove: async (k: string) => void m.delete(k),
    keys: async (p: string) => [...m.keys()].filter(k => k.startsWith(p)),
  };
  return { kv, database: jest.fn() };
});
jest.mock('@/offline/storage', () => ({ queueStorage: require('@/offline/queue').memoryQueueStorage() }));
jest.mock('expo-router', () => {
  const params: Record<string, string> = {};
  return {
    __params: params,
    useLocalSearchParams: () => params,
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
    Link: () => null,
  };
});
