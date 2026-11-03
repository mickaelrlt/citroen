import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/CrudPage";
import { euro } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/direction")({
  head: () => ({
    meta: [
      { title: "Véhicules de direction — Carnet Vendeur" },
      { name: "description", content: "Stock des véhicules de direction disponibles." },
      { property: "og:title", content: "Véhicules de direction — Carnet Vendeur" },
      { property: "og:description", content: "Stock des véhicules de direction disponibles." },
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
        { name: "prix", label: "Prix (€)", type: "number" },
        { name: "options", label: "Options", type: "textarea" },
      ]}
      cardTitle={(i) => `${i.modele ?? "Véhicule"} ${i.finition ?? ""}`}
      cardTags={(i) => [String(i.immat ?? "")]}
      cardMeta={(i) => (
        <>
          <p className="font-display text-2xl font-bold text-primary">{euro(i.prix)}</p>
          {i.chassis ? <p>VIN : {String(i.chassis)}</p> : null}
          {i.options ? <p className="whitespace-pre-line">{String(i.options)}</p> : null}
        </>
      )}
    />
  ),
});
