import { randomBytes } from "node:crypto";

export type InviteRoom = {
  code: string;
  hostSecondMeId: string;
  guestSecondMeId?: string;
  createdAt: number;
};

const TTL_MS = 1000 * 60 * 45;
const rooms = new Map<string, InviteRoom>();

function sweep() {
  const now = Date.now();
  for (const [code, r] of rooms) {
    if (now - r.createdAt > TTL_MS) rooms.delete(code);
  }
}

function randomCode(): string {
  return randomBytes(4).toString("hex").slice(0, 8).toUpperCase();
}

export function createInviteRoom(hostSecondMeId: string): InviteRoom {
  sweep();
  let code = randomCode();
  let guard = 0;
  while (rooms.has(code) && guard++ < 10) code = randomCode();
  const room: InviteRoom = {
    code,
    hostSecondMeId,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getInviteRoom(code: string): InviteRoom | undefined {
  sweep();
  return rooms.get(code.toUpperCase());
}

export function joinInviteRoom(
  code: string,
  guestSecondMeId: string,
): { ok: true; room: InviteRoom } | { ok: false; reason: string } {
  sweep();
  const upper = code.toUpperCase();
  const room = rooms.get(upper);
  if (!room) return { ok: false, reason: "房间不存在或已过期" };
  if (room.hostSecondMeId === guestSecondMeId) {
    return { ok: false, reason: "不能与自己配对" };
  }
  if (room.guestSecondMeId && room.guestSecondMeId !== guestSecondMeId) {
    return { ok: false, reason: "房间已满" };
  }
  room.guestSecondMeId = guestSecondMeId;
  rooms.set(upper, room);
  return { ok: true, room };
}
