import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_EVENTS } from '../types';
import { useWebSocketStore } from '../store/uiStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/dashboard';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const { setConnected, setConnecting } = useWebSocketStore();
  const [lastMessage, setLastMessage] = useState(null);
  
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnecting(true);
    
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('[WS] Connected');
        setConnected(true);
        setConnecting(false);
        reconnectAttemptsRef.current = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        setConnected(false);
        setConnecting(false);
        
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`[WS] Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY * reconnectAttemptsRef.current);
        } else {
          console.error('[WS] Max reconnect attempts reached');
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (err) {
      console.error('[WS] Failed to create connection:', err);
      setConnecting(false);
    }
  }, [onMessage, setConnected, setConnecting]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
  }, [setConnected, setConnecting]);
  
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);
  
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);
  
  return { lastMessage, send, connect, disconnect, connected: useWebSocketStore.getState().connected };
}

export function useDashboardWebSocket() {
  const { addIncident, updateIncident, removeIncident, updateAlert, addAlert, setResourceAssigned } = useWebSocketStore();
  
  const handleMessage = useCallback((message) => {
    const { event, data } = message;
    
    switch (event) {
      case WS_EVENTS.INCIDENT_CREATED:
        addIncident(data);
        break;
      case WS_EVENTS.INCIDENT_UPDATED:
        updateIncident(data);
        break;
      case WS_EVENTS.INCIDENT_CONSOLIDATED:
        updateIncident(data);
        break;
      case WS_EVENTS.INCIDENT_ESCALATED:
        addAlert({
          id: `escalation-${data.incident_id}-${Date.now()}`,
          incident_id: data.incident_id,
          alert_type: 'escalation',
          message: data.message,
          status: 'active',
          created_at: new Date().toISOString(),
        });
        break;
      case WS_EVENTS.RESOURCE_ASSIGNED:
        setResourceAssigned(data.assignment, data.incident_id);
        break;
      default:
        console.log('[WS] Unknown event:', event);
    }
  }, [addIncident, updateIncident, removeIncident, addAlert, setResourceAssigned]);
  
  return useWebSocket(handleMessage);
}