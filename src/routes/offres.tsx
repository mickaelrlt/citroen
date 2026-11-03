import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { euro } from "@/lib/store";

export const Route = createFileRoute("/offres")({
  head: () => ({
    meta: [
      { title: "Clients offre — Carnet Vendeur" },
      { name: "description", content: "Suivi des clients en offre : financement, reprise et relances." },
      { property: "og:title", content: "Clients offre — Carnet Vendeur" },
      { property: "og:description", content: "Suivi des clients en offre : financement, reprise et relances." },
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
        { name: "note", label: "Note (ex : client indécis pour une C3)", type: "textarea", section: "Client" },
        { name: "modele", label: "Véhicule proposé", section: "Offre" },
        { name: "financement", label: "Financement", type: "select", options: ["LOA", "LLD", "COMPTANT"], section: "Offre" },
        { name: "detailOffre", label: "Détail de l'offre (loyer, durée, apport…)", type: "textarea", section: "Offre" },
        { name: "repriseVehicule", label: "Véhicule repris", section: "Reprise" },
        { name: "repriseMontant", label: "Montant de reprise (€)", type: "number", section: "Reprise" },
      ]}
      cardTitle={(i) => [i.prenom, i.nom].filter(Boolean).join(" ") || "Client sans nom"}
      cardTags={(i) => [String(i.financement ?? ""), String(i.modele ?? "")]}
      cardMeta={(i) => (
        <>
          {i.tel ? <p>📞 <a className="underline" href={`tel:${i.tel}`}>{String(i.tel)}</a></p> : null}
          {i.email ? <p>✉️ {String(i.email)}</p> : null}
          {i.repriseVehicule || i.repriseMontant ? (
            <p>Reprise : {String(i.repriseVehicule ?? "")} {euro(i.repriseMontant)}</p>
          ) : null}
          {i.note ? <p className="italic text-foreground">« {String(i.note)} »</p> : null}
        </>
      )}
    />
  ),
});
