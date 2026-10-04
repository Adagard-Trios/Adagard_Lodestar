// Test helper: draws a stroke on a SignaturePad through the responder events a finger (or a mouse on the web) sends.
import { fireEvent, screen } from '@testing-library/react-native';

let t = 0;
const ev = (x: number, y: number) => {
  t += 16;
  const touch = { touchActive: true, startPageX: x, startPageY: y, startTimeStamp: t, currentPageX: x, currentPageY: y, currentTimeStamp: t, previousPageX: x, previousPageY: y, previousTimeStamp: t };
  return {
    nativeEvent: { locationX: x, locationY: y, pageX: x, pageY: y, timestamp: t, touches: [], changedTouches: [] },
    touchHistory: { touchBank: [touch], numberActiveTouches: 1, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: t },
  };
};

export async function draw(testID: string, points: [number, number][]) {
  const surface = screen.getByTestId(`${testID}-surface`);
  await fireEvent(surface, 'layout', { nativeEvent: { layout: { width: 280, height: 70 } } });
  await fireEvent(surface, 'responderGrant', ev(...points[0]));
  for (const p of points.slice(1)) await fireEvent(surface, 'responderMove', ev(...p));
  await fireEvent(surface, 'responderRelease', ev(...points[points.length - 1]));
}
