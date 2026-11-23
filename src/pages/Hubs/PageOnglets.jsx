import { Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs } from "../../components/atelier/ui";
import ChargementPage from "../../components/common/ChargementPage";

// ============================================================
// ✅ Page à onglets : regroupe des pages existantes sous une seule entrée
// de menu (Stock, Achats, Statistiques, Catalogue, Fin de journée).
// onglets : [{ key, label, visible, element }] ; onglet actif dans l'URL
// (?onglet=…) pour les liens directs et le bouton « retour ».
// ============================================================
const PageOnglets = ({ onglets, defaut, entete = null }) => {
  const [sp, setSp] = useSearchParams();
  const visibles = onglets.filter((o) => o.visible !== false);
  const actif = visibles.find((o) => o.key === sp.get("onglet"))
    || visibles.find((o) => o.key === defaut)
    || visibles[0];

  if (!actif) {
    return (
      <div className="empty-state" style={{ minHeight: "400px" }}>
        <div className="empty-state-icon">🚫</div>
        <div className="empty-state-title">Accès refusé</div>
        <div className="empty-state-text">Vous n'avez accès à aucune partie de cette page.</div>
      </div>
    );
  }

  return (
    <>
      {entete}
      {visibles.length > 1 && (
        <div className="page-onglets">
          <Tabs tabs={visibles.map((o) => [o.key, o.label])} value={actif.key}
            onChange={(k) => setSp({ onglet: k })} />
        </div>
      )}
      <Suspense fallback={<ChargementPage />}>
        <div key={actif.key}>{actif.element}</div>
      </Suspense>
    </>
  );
};

export default PageOnglets;
