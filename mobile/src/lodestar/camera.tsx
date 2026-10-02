// The camera where a design shows a viewfinder ("Read from photo · confirm"). `read(kind)` photographs and asks the
// OCR service (lodestar/ocr.ts) for the value; the person always confirms it, and typing stays the fallback. Barcodes are
// read by expo-camera's built-in scanner (LD-10). No permission or no camera: the screen's own overlay
// (children, real state only: the code read, or how to turn the camera on) shows and the manual fallback still works.
import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import { readPhoto, type OcrKind, type OcrResult } from './ocr';

export type CameraHandle = { capture: () => Promise<string | null> };

const BARCODES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr', 'datamatrix', 'itf14'];

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  // the mounted camera (state, not a ref: the screen re-renders when it appears)
  const [view, setView] = useState<CameraView | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const granted = !!permission?.granted && !failed;

  /** Asks for the camera when needed; true when the camera can show. */
  async function ensure(): Promise<boolean> {
    if (permission?.granted) return true;
    const r = await requestPermission().catch(() => null);
    return !!r?.granted;
  }

  /** Takes a photo; its local uri (kept on the phone), or null without a camera. */
  async function capture(): Promise<string | null> {
    if (!granted || !ready || !view) return null;
    try {
      const pic = await view.takePictureAsync({ quality: 0.5, skipProcessing: true });
      return pic?.uri ?? null;
    } catch {
      return null;
    }
  }

  const [reading, setReading] = useState(false);
  /** Photographs and reads it (OCR). null when there is no camera or nothing could be read: type it instead. */
  async function read(kind: OcrKind): Promise<OcrResult | null> {
    if (!granted || !ready || !view || reading) return null;
    setReading(true);
    try {
      const pic = await view.takePictureAsync({ quality: 0.6, base64: true, skipProcessing: true });
      const image = pic?.base64 ? `data:image/jpeg;base64,${pic.base64}` : pic?.uri ?? '';
      return await readPhoto(image, kind);
    } catch {
      return null;
    } finally {
      setReading(false);
    }
  }

  return { setView, permission, granted, ready, setReady, failed, setFailed, ensure, capture, read, reading };
}

/**
 * The viewfinder box. `cam` from useCamera(). With `onCode` the barcode scanner runs.
 * `children` is drawn over the camera: the screen's live state (never a picture of a sample label).
 */
export function CameraBox({ cam, style, onCode, children, testID }: {
  cam: ReturnType<typeof useCamera>;
  style?: StyleProp<ViewStyle>;
  onCode?: (data: string) => void;
  children?: ReactNode;
  testID?: string;
}) {
  const { granted, setView, setReady, setFailed } = cam;
  return (
    <View style={[style, { overflow: 'hidden' }]} testID={testID ?? 'camera-box'}>
      {granted && (
        <CameraView
          ref={setView}
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          facing="back"
          onCameraReady={() => setReady(true)}
          onMountError={() => setFailed(true)}
          barcodeScannerSettings={onCode ? { barcodeTypes: BARCODES } : undefined}
          onBarcodeScanned={onCode ? r => r?.data && onCode(r.data) : undefined}
        />
      )}
      {children}
    </View>
  );
}
