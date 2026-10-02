// "Read from photo · confirm": sends a photo to the OCR service behind the gateway (/ocr/read: RapidOCR, PP-OCR
// mobile models on CPU) and returns the value it read, for the person to confirm or correct. Any failure (offline,
// slow, nothing readable) returns null and the screen keeps its manual entry: the read is a convenience, never a gate.
import { apiBase } from '@/lib/config';
import { getDeviceId, session } from '@/model/platform';

export type OcrKind = 'temperature' | 'seal' | 'label' | 'code' | 'text';
export type OcrResult = { value: string | null; text: string; confidence: number };

const TIMEOUT_MS = 12_000;

/** The photo as base64 (a data: URL is fine) → what the service read, or null. */
export async function readPhoto(image: string, kind: OcrKind): Promise<OcrResult | null> {
  try {
    const token = await session.accessToken();
    if (!token || !image) return null;
    const res = await fetch(`${apiBase()}/ocr/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Device-Id': await getDeviceId() },
      body: JSON.stringify({ image, kind }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const r = (await res.json()) as { value?: string | null; text?: string; confidence?: number };
    const value = (r.value ?? '').trim() || null;
    return value || r.text ? { value, text: r.text ?? '', confidence: r.confidence ?? 0 } : null;
  } catch {
    return null;
  }
}
