import { useState, useEffect } from 'react';

/**
 * useOfflineQueue — manages the SQLite offline event queue for the driver app.
 * In the real implementation, this would use expo-sqlite to persist events
 * when the device loses signal (e.g. above Ramboda) and sync them when 
 * the network returns.
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Mock implementation for demo
  const enqueueEvent = (eventType: string, payload: any) => {
    const event = {
      id: Math.random().toString(36).substring(7),
      eventType,
      payload,
      savedAt: new Date().toISOString()
    };
    
    if (!isOnline) {
      setQueue(prev => [...prev, event]);
      console.log(`[OfflineQueue] Queued event: ${eventType}`);
    } else {
      // Direct push if online
      console.log(`[Online] Pushed event: ${eventType}`);
    }
  };

  const syncQueue = async () => {
    if (queue.length === 0) return;
    
    console.log(`[Sync] Pushing ${queue.length} events to Lodestar HQ...`);
    try {
      await fetch('http://localhost:8080/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: queue })
      });
      setQueue([]);
      console.log('[Sync] Success');
    } catch (e) {
      console.error('[Sync] Failed, keeping queue');
    }
  };

  return { queue, isOnline, setIsOnline, enqueueEvent, syncQueue };
}
