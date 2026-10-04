// Keyboard for a temperature reading (may be negative, may have a decimal point).
// 'numbers-and-punctuation' exists on iOS only; Android ignores it and shows the full text keyboard, so phones
// there get the numeric pad (Gboard and most keyboards show the minus sign on it).
import { Platform, type KeyboardTypeOptions } from 'react-native';

export const TEMP_KEYBOARD: KeyboardTypeOptions = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';
