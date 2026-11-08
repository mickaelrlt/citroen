import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    storage: { from: () => ({ upload: mocks.upload }) },
    from: () => ({ insert: mocks.insert, update: mocks.update }),
  },
}));

import { uploadClientDocument } from "@/lib/client-document";
import { clearAll, upsert } from "@/lib/store";

describe("Offer and order documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAll();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner-id" } }, error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
  });

  it.each([
    ["commandes", "dateCommande"],
    ["offres", "dateOffre"],
  ] as const)("persists the date and PDF on %s when creating and editing", async (collection, dateField) => {
    const documentPdf = { name: "document.pdf", path: "owner-id/document.pdf" };
    await upsert(collection, { [dateField]: "2026-11-08", documentPdf });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ collection, data: { [dateField]: "2026-11-08", documentPdf } }));
    await upsert(collection, { id: "existing-item", [dateField]: "2026-11-09", documentPdf });
    expect(mocks.update).toHaveBeenCalledWith({ data: { [dateField]: "2026-11-09", documentPdf } });
    expect(mocks.eq).toHaveBeenCalledWith("id", "existing-item");
  });

  it("uploads PDFs in the signed-in user's private folder", async () => {
    const file = { name: "commande.pdf", slice: () => ({ arrayBuffer: async () => new TextEncoder().encode("%PDF-").buffer }) } as File;
    const result = await uploadClientDocument(file);
    expect(result.path).toMatch(/^owner-id\/.+\.pdf$/);
    expect(result.name).toBe("commande.pdf");
    expect(mocks.upload).toHaveBeenCalledWith(result.path, file, { contentType: "application/pdf" });
  });
});