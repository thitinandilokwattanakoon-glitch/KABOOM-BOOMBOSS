import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { WS_ENDPOINT } from '../api/config';
import { ApiError } from '../api/http';
import { roomsApi } from '../api/rooms';
import type { RoomView } from '../types/room';

/**
 * Keeps the latest room state: one GET at the start (and after every reconnect, so nothing is missed),
 * then every change the server pushes over /topic/rooms/{code}.
 * `notFound` becomes true when the server doesn't know the room (wrong code, or the backend restarted).
 */
export function useRoom(code: string) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [connected, setConnected] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const offsetRef = useRef(0); // serverTime - browserTime, so countdowns match the server's clock

  const apply = useCallback((view: RoomView) => {
    offsetRef.current = view.serverNowMs - Date.now();
    setRoom(view);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () =>
      roomsApi
        .get(code)
        .then((v) => alive && apply(v))
        .catch((e) => {
          if (alive && e instanceof ApiError && e.status === 404) setNotFound(true);
        });
    load();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT) as unknown as WebSocket,
      reconnectDelay: 2000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/rooms/${code}`, (m) => apply(JSON.parse(m.body) as RoomView));
        load();
      },
      onWebSocketClose: () => setConnected(false)
    });
    client.activate();

    return () => {
      alive = false;
      client.deactivate();
    };
  }, [code, apply]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);
  return { room, connected, notFound, apply, serverNow };
}
