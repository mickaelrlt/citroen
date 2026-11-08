import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { fmtDate, type BaseItem } from "@/lib/store";
import { groupOrdersByMonth } from "@/lib/order-months";

const isLivre = (i: BaseItem) => Array.isArray(i.statuts) && i.statuts.includes("Livré");

export const STATUTS = [
  "Papiers non reçus",
  "Papiers OK",
  "Financement en attente",
  "En attente de livraison",
  "Livré",
];
const STATUT_COLORS: Record<string, string> = {
  "Papiers non reçus": "tag-red",
  "Papiers OK": "tag-green",
  "Financement en attente": "tag-orange",
  "En attente de livraison": "tag-green",
  "Livré": "tag-blue",
};

export const Route = createFileRoute("/_authenticated/commandes")({
  head: () => ({
    meta: [
      { title: "Clients commande — Carnet Vendeur" },
      { name: "description", content: "Suivi des commandes : statut, financement, livraison." },
      { property: "og:title", content: "Clients commande — Carnet Vendeur" },
      { property: "og:description", content: "Suivi des commandes : statut, financement, livraison." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <CrudPage
      groups={[
        { label: "En cours", test: (i) => !isLivre(i) },
        { label: "Livré", test: isLivre },
      ]}
      collection="commandes"
      subgroupItems={groupOrdersByMonth}
      title="Clients commande"
      subtitle="Commandes en cours jusqu'à la livraison"
      newLabel="Nouvelle commande"
      withReminder
      fields={[
        { name: "prenom", label: "Prénom", section: "Client" },
        { name: "nom", label: "Nom", section: "Client" },
        { name: "tel", label: "Téléphone", type: "tel", section: "Client" },
        { name: "statuts", label: "Statuts (plusieurs possibles)", type: "multi", options: STATUTS, section: "Client" },
        { name: "dateCommande", label: "Date de la commande", type: "date", section: "Commande" },
        { name: "documentPdf", label: "Bon de commande (PDF)", type: "pdf", section: "Commande", full: true },
        { name: "etat", label: "Neuf / Occasion", type: "select", options: ["Neuf", "Occasion"], section: "Véhicule" },
        { name: "modele", label: "Modèle", section: "Véhicule" },
        { name: "immat", label: "Immatriculation", section: "Véhicule" },
        { name: "chassis", label: "N° de châssis (VIN)", section: "Véhicule" },
        { name: "financement", label: "Financement", type: "select", options: ["LOA", "LLD", "COMPTANT"], section: "Véhicule" },
        { name: "livraison", label: "Date de livraison prévue", type: "date", section: "Véhicule" },
        { name: "note", label: "Note", type: "textarea", section: "Véhicule" },
      ]}
      cardTitle={(i) => [i.prenom, i.nom].filter(Boolean).join(" ") || String(i.modele ?? "Commande")}
      tagColors={STATUT_COLORS}
      cardTags={(i) => [...(Array.isArray(i.statuts) ? (i.statuts as string[]) : []), String(i.etat ?? ""), String(i.financement ?? "")]}
      cardMeta={(i) => (
        <>
          {i['dateCommande'] ? <p>Commande du {fmtDate(i['dateCommande'])}</p> : null}
          <p className="font-medium text-foreground">{String(i.modele ?? "")} {i.immat ? `· ${i.immat}` : ""}</p>
          {i.chassis ? <p>VIN : {String(i.chassis)}</p> : null}
          {i.livraison ? <p>🚚 Livraison : {fmtDate(i.livraison)}</p> : null}
          {i.tel ? <p>📞 <a className="underline" href={`tel:${i.tel}`}>{String(i.tel)}</a></p> : null}
        </>
      )}
    />
  ),
});
