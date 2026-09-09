/** Decisão pura sobre que lugar de dispositivo usar quando um convidado valida o telemóvel. */
export type DeviceSlot = { id: string; lastSeenAt: Date };

export type SlotDecision = { kind: "create" } | { kind: "replace"; id: string };

/**
 * Enquanto houver lugares livres, cada validação cria um dispositivo novo (mesmo com o mesmo browser: o browser interno do
 * WhatsApp e o Safari são contextos diferentes). Ao atingir o limite, substitui o dispositivo há mais tempo sem uso.
 */
export function pickDeviceSlot(devices: DeviceSlot[], max: number): SlotDecision {
  if (devices.length < Math.max(1, max)) return { kind: "create" };
  const oldest = [...devices].sort((a, b) => a.lastSeenAt.getTime() - b.lastSeenAt.getTime())[0];
  return { kind: "replace", id: oldest.id };
}
