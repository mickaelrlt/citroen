import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { euro, fmtDate, type BaseItem } from "@/lib/store";

const hasVin = (e: Partial<BaseItem>) => e.etat === "OCCASION" || (e.etat === "NEUF" && e.source === "STOCK");
const hasCar = (e: Partial<BaseItem>) => e.etat === "OCCASION" || (e.etat === "NEUF" && !!e.source);

export const Route = createFileRoute("/_authenticated/offres")({
  head: () => ({
    meta: [
      { title: "Clients offre — Carnet Vendeur" },
      { name: "description", content: "Suivi des clients en offre : financement, reprise et relances." },
      { property: "og:title", content: "Clients offre — Carnet Vendeur" },
      { property: "og:description", content: "Suivi des clients en offre : financement, reprise et relances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <CrudPage
      collection="offres"
      title="Clients offre"
      subtitle="Prospects, propositions et relances"
      newLabel="Nouveau client"
      withReminder
      fields={[
        { name: "prenom", label: "Prénom", section: "Client" },
        { name: "nom", label: "Nom", section: "Client" },
        { name: "tel", label: "Téléphone", type: "tel", section: "Client" },
        { name: "email", label: "E-mail", type: "email", section: "Client" },
        { name: "adresse", label: "Adresse", section: "Client", full: true },
        { name: "note", label: "Note", type: "textarea", section: "Client" },
        { name: "dateOffre", label: "Date de l’offre", type: "date", section: "Offre" },
        { name: "documentPdf", label: "Offre (PDF)", type: "pdf", section: "Offre", full: true },
        { name: "etat", label: "Véhicule", type: "choice", options: ["NEUF", "OCCASION"], section: "Offre", full: true },
        { name: "source", label: "Neuf", type: "choice", options: ["STOCK", "COMMANDE"], section: "Offre", full: true, showIf: (e) => e.etat === "NEUF" },
        { name: "immat", label: "Immatriculation", section: "Offre", showIf: hasVin },
        { name: "chassis", label: "VIN", section: "Offre", showIf: hasVin },
        { name: "modele", label: "Modèle", section: "Offre", showIf: hasCar },
        { name: "finition", label: "Finition", section: "Offre", showIf: hasCar },
        { name: "financement", label: "Financement", type: "select", options: ["LOA", "LLD", "COMPTANT"], section: "Offre", showIf: hasCar },
        { name: "detailOffre", label: "Détail de l'offre (loyer, durée, apport…)", type: "textarea", section: "Offre" },
        { name: "reprise", label: "Reprise", type: "check", section: "Reprise", full: true },
        { name: "repriseVehicule", label: "Véhicule repris", section: "Reprise", showIf: (e) => !!e.reprise },
        { name: "repriseMontant", label: "Montant de reprise (€)", type: "number", section: "Reprise", showIf: (e) => !!e.reprise },
        { name: "repriseDate", label: "Date de livraison", type: "date", section: "Reprise", showIf: (e) => !!e.reprise },
        { name: "repriseNote", label: "Note", type: "textarea", section: "Reprise", showIf: (e) => !!e.reprise },
      ]}
      cardTitle={(i) => [i.prenom, i.nom].filter(Boolean).join(" ") || "Client sans nom"}
      cardTags={(i) => [String(i.etat ?? ""), String(i.source ?? ""), String(i.financement ?? ""), String(i.modele ?? "")]}
      cardMeta={(i) => (
        <>
          {i['dateOffre'] ? <p>Offre du {fmtDate(i['dateOffre'])}</p> : null}
          {i.tel ? <p>📞 <a className="underline" href={`tel:${i.tel}`}>{String(i.tel)}</a></p> : null}
          {i.email ? <p>✉️ {String(i.email)}</p> : null}
          {i.repriseVehicule || i.repriseMontant ? (
            <p>Reprise : {String(i.repriseVehicule ?? "")} {euro(i.repriseMontant)}{i.repriseDate ? ` · livraison le ${fmtDate(i.repriseDate)}` : ""}</p>
          ) : null}
          {i.note ? <p className="italic text-foreground">« {String(i.note)} »</p> : null}
        </>
      )}
    />
  ),
});
