import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: mocks }));
import { clearAll, getAll, loadAll, startDirectionSync, upsert, remove } from "@/lib/store";

const vehicle = { id: "another-users-vehicle", collection: "direction", data: { modele: "C3", prix: 18000 }, created_at: "2026-11-09" };

describe("Shared direction stock", () => {
  let rows: typeof vehicle[];
  let events: { filter: Record<string, string>; callback: () => void }[];
  let order: ReturnType<typeof vi.fn>;
  let eq: ReturnType<typeof vi.fn>;
  let write: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    clearAll();
    vi.clearAllMocks();
    vi.useFakeTimers();
    rows = [vehicle];
    events = [];
    order = vi.fn(async () => ({ data: rows, error: null }));
    eq = vi.fn(() => ({ order }));
    write = vi.fn(async () => ({ error: null }));
    mocks.from.mockReturnValue({ select: () => ({ eq, order }), insert: write, update: () => ({ eq: write }), delete: () => ({ eq: write }) });
    const channel = { on: vi.fn((_event, filter, callback) => { events.push({ filter, callback }); return channel; }), subscribe: vi.fn(() => channel) };
    mocks.channel.mockReturnValue(channel);
    mocks.removeChannel.mockResolvedValue(undefined);
  });
  afterEach(() => { clearAll(); vi.useRealTimers(); });

  it("refreshes another account's direction modifications without changing private offers", async () => {
    rows = [vehicle, { ...vehicle, id: "private-offer", collection: "offres", data: { modele: "Private", prix: 1 } }];
    await loadAll();
    rows = [{ ...vehicle, data: { modele: "C4", prix: 21000 } }];
    startDirectionSync();
    await vi.advanceTimersByTimeAsync(0);
    expect(getAll("direction")[0]?.modele).toBe("C4");
    expect(getAll("offres")[0]?.modele).toBe("Private");
    expect(eq).toHaveBeenCalledWith("collection", "direction");
    expect(events.map((e) => e.filter)).toEqual([
      { event: "INSERT", schema: "public", table: "items", filter: "collection=eq.direction" },
      { event: "UPDATE", schema: "public", table: "items", filter: "collection=eq.direction" },
    ]);
    rows = [{ ...vehicle, data: { modele: "C5", prix: 25000 } }];
    events[1]?.callback();
    await vi.advanceTimersByTimeAsync(0);
    expect(getAll("direction")[0]?.prix).toBe(25000);
    expect(getAll("offres")).toHaveLength(1);
  });

  it("automatically removes deleted shared vehicles within ten seconds", async () => {
    startDirectionSync();
    await vi.advanceTimersByTimeAsync(0);
    expect(getAll("direction")).toHaveLength(1);
    rows = [];
    await vi.advanceTimersByTimeAsync(10000);
    expect(getAll("direction")).toEqual([]);
  });

  it("stops subscriptions and ignores pending reads after sign-out", async () => {
    let resolveRead: ((value: { data: typeof rows; error: null }) => void) | undefined;
    order.mockImplementation(() => new Promise((resolve) => { resolveRead = resolve; }));
    startDirectionSync();
    clearAll();
    resolveRead?.({ data: [vehicle], error: null });
    await vi.advanceTimersByTimeAsync(20000);
    expect(getAll("direction")).toEqual([]);
    expect(mocks.removeChannel).toHaveBeenCalledTimes(1);
    expect(order).toHaveBeenCalledTimes(1);
  });

  it("allows editing and deleting shared records and does not publish failed writes locally", async () => {
    await loadAll();
    rows = [{ ...vehicle, data: { modele: "C3", prix: 22000 } }];
    await upsert("direction", { id: vehicle.id, prix: 22000 });
    expect(write).toHaveBeenCalledWith("id", vehicle.id);
    expect(getAll("direction")[0]?.prix).toBe(22000);
    write.mockResolvedValueOnce({ error: new Error("Offline") });
    await expect(upsert("direction", { id: vehicle.id, prix: 99 })).rejects.toThrow("Offline");
    expect(getAll("direction")[0]?.prix).toBe(22000);
    rows = [];
    await remove("direction", vehicle.id);
    expect(getAll("direction")).toEqual([]);
  });
});