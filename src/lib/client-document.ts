import { supabase } from "@/integrations/supabase/client";

export interface ClientDocument {
  name: string;
  path: string;
}

export function asClientDocument(value: unknown): ClientDocument | null {
  if (!value || typeof value !== "object") return null;
  const document = value as Record<string, unknown>;
  return typeof document['name'] === "string" && typeof document['path'] === "string"
    ? { name: document['name'], path: document['path'] }
    : null;
}

export async function uploadClientDocument(file: File): Promise<ClientDocument> {
  const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw new Error("Choisissez un fichier PDF valide.");
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error("Reconnectez-vous pour ajouter votre PDF.");
  const path = `${data.user.id}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("pdfs").upload(path, file, { contentType: "application/pdf" });
  if (error) throw new Error("Envoi du PDF impossible, vérifiez votre connexion.");
  return { name: file.name, path };
}

export async function deleteClientDocument(document: ClientDocument) {
  const { error } = await supabase.storage.from("pdfs").remove([document.path]);
  if (error) throw error;
}