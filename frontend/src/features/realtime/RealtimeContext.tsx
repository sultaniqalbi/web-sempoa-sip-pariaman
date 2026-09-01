import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeEvent {
  event: string;
  data: any;
  timestamp?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  triggerManualSync: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEvent: null,
  triggerManualSync: () => {},
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const invalidateAllPortals = (reason?: string) => {
    // Invalidate Parent portal queries
    queryClient.invalidateQueries({ queryKey: ['child-profile'] });
    queryClient.invalidateQueries({ queryKey: ['child-absensi'] });
    queryClient.invalidateQueries({ queryKey: ['child-absensi-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['child-catatan-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['child-payments-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['child-payments'] });
    queryClient.invalidateQueries({ queryKey: ['child-proof-history'] });
    queryClient.invalidateQueries({ queryKey: ['schedule-today'] });

    // Invalidate Guru portal queries
    queryClient.invalidateQueries({ queryKey: ['guru-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['guru-siswa-absensi'] });
    queryClient.invalidateQueries({ queryKey: ['guru-rekap-absensi'] });
    queryClient.invalidateQueries({ queryKey: ['guru-absensi-list'] });

    // Invalidate Admin & Owner portal queries
    queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['siswa'] });
    queryClient.invalidateQueries({ queryKey: ['absensi'] });
    queryClient.invalidateQueries({ queryKey: ['pembayaran'] });
    queryClient.invalidateQueries({ queryKey: ['bukti-transfer'] });
    queryClient.invalidateQueries({ queryKey: ['quota'] });
    queryClient.invalidateQueries({ queryKey: ['jadwal'] });
  };

  const triggerManualSync = () => {
    invalidateAllPortals('manual_sync');
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'MANUAL_SYNC' });
    }
  };

  // BroadcastChannel for cross-tab realtime sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('sempoa_realtime_sync');
      broadcastChannelRef.current = channel;
      channel.onmessage = (msgEvent) => {
        if (msgEvent.data) {
          invalidateAllPortals('broadcast_channel');
        }
      };
      return () => {
        channel.close();
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const getWebSocketUrl = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const token = localStorage.getItem('access_token');
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
      return `${protocol}//${host}/api/v1/realtime/ws${tokenParam}`;
    };

    const connectWebSocket = () => {
      if (!isMounted) return;

      // Gate connection: only connect when user has an active authentication token
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsConnected(false);
        return;
      }

      try {
        const wsUrl = getWebSocketUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);

          // Start ping heartbeat every 25s
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data: RealtimeEvent = JSON.parse(event.data);
            setLastEvent(data);

            if (
              data.event === 'ABSENSI_UPDATE' ||
              data.event === 'CARD_TAP' ||
              data.event === 'MANUAL_SYNC' ||
              data.event === 'CATATAN_UPDATE' ||
              data.event === 'MODE_KELAS_UPDATE' ||
              data.event === 'DATA_UPDATE' ||
              data.event === 'NEW_PAYMENT_PROOF' ||
              data.event === 'PAYMENT_PROOF_VERIFIED' ||
              data.event === 'PAYMENT_UPDATE'
            ) {
              invalidateAllPortals(data.event);
              if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({ type: data.event, data: data.data });
              }
            }
          } catch (err) {
            // Ignored non-json frames
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          // Reconnect with 3s backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, triggerManualSync }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
export default RealtimeProvider;
