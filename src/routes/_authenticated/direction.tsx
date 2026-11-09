import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { euro, fmtDate } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/direction")({
  head: () => ({
    meta: [
      { title: "Véhicules de direction — Carnet Vendeur" },
      { name: "description", content: "Stock des véhicules de direction disponibles." },
      { property: "og:title", content: "Véhicules de direction — Carnet Vendeur" },
      { property: "og:description", content: "Stock des véhicules de direction disponibles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <CrudPage
      collection="direction"
      title="Véhicules de direction"
      subtitle="Stock disponible à la vente"
      newLabel="Ajouter un véhicule"
      fields={[
        { name: "modele", label: "Modèle" },
        { name: "finition", label: "Finition" },
        { name: "immat", label: "Immatriculation" },
        { name: "chassis", label: "N° de châssis (VIN)" },
        { name: "dateImmat", label: "Date d'immatriculation", type: "date" },
        { name: "affectation", label: "Affectation" },
        { name: "assurance", label: "Assurance", type: "select", options: ["OUI", "NON"] },
        { name: "carteGrise", label: "Carte grise" },
        { name: "prix", label: "Prix (€)", type: "number" },
        { name: "options", label: "Options", type: "textarea" },
      ]}
      cardTitle={(i) => `${i.modele ?? "Véhicule"} ${i.finition ?? ""}`}
      cardTags={(i) => [String(i.immat ?? ""), i.assurance ? `Assurance ${i.assurance}` : ""]}
      tagColors={{ "Assurance OUI": "tag-green", "Assurance NON": "tag-red" }}
      cardMeta={(i) => (
        <>
          <p className="font-display text-2xl font-bold text-primary">{euro(i.prix)}</p>
          {i.chassis ? <p>VIN : {String(i.chassis)}</p> : null}
          {i.dateImmat ? <p>Immatriculé le {fmtDate(i.dateImmat)}</p> : null}
          {i.affectation ? <p>Affectation : {String(i.affectation)}</p> : null}
          {i.carteGrise ? <p>Carte grise : {String(i.carteGrise)}</p> : null}
          {i.options ? <p className="whitespace-pre-line">{String(i.options)}</p> : null}
        </>
      )}
    />
  ),
});
