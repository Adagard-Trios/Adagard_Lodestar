// The camera where a design shows a viewfinder ("Read from photo · confirm"). It only captures: the
// photo stays on the phone and the person types or confirms the value (no reading by AI). Barcodes are
// read by expo-camera's built-in scanner (LD-10). No permission or no camera: the screen's own overlay
// (children, real state only: the code read, or how to turn the camera on) shows and the manual fallback still works.
import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';

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

  return { setView, permission, granted, ready, setReady, failed, setFailed, ensure, capture };
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
