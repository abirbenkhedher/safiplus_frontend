import { lazy, useEffect, useState } from "react";
import { FaCashRegister, FaLock, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { getCaisseCourante } from "../../api/caisse";
import PageOnglets from "./PageOnglets";

// ============================================================
// ✅ Regroupements de pages (une entrée de menu, des onglets)
// Les pages d'origine sont inchangées ; leurs anciennes adresses
// redirigent ici (cf. App.jsx).
// ============================================================
const StockList = lazy(() => import("../Stock/StockList"));
const StockOperations = lazy(() => import("../Atelier/StockOperations"));
const Achats = lazy(() => import("../Atelier/Achats"));
const Fournisseurs = lazy(() => import("../Atelier/Fournisseurs"));
const Statistiques = lazy(() => import("../Statistiques/Statistiques"));
const RapportCommercial = lazy(() => import("../Commercial/RapportCommercial"));
const VueGlobale = lazy(() => import("../Commercial/VueGlobale"));
const Caisse = lazy(() => import("../Commercial/Caisse"));
const Clotures = lazy(() => import("../Atelier/Clotures"));
const FamillesCRUD = lazy(() => import("../Familles/FamillesCRUD"));
const CategoriesCRUD = lazy(() => import("../Categories/CategoriesCRUD"));
const ObjetsCRUD = lazy(() => import("../Objets/ObjetsCRUD"));
const MarquesCRUD = lazy(() => import("../marques/MarquesCRUD"));
const ModelesCRUD = lazy(() => import("../modeles/ModelesCRUD"));

/** Stock : articles + transferts / inventaire */
export const StockHub = () => {
  const { hasPermission, hasAnyPermission, espaceActif } = useAuth();
  return (
    <PageOnglets onglets={[
      { key: "articles", label: espaceActif === "commerce" ? "Produits" : "Pièces & stock", visible: hasAnyPermission(["stock", "stock:read"]), element: <StockList /> },
      { key: "operations", label: "Transferts / inventaire", visible: hasPermission("stock"), element: <StockOperations /> },
    ]} />
  );
};

/** Achats : commandes + factures d'achat, fournisseurs */
export const AchatsHub = () => {
  const { hasAnyPermission, hasModule } = useAuth();
  const actif = hasModule("achats");
  return (
    <PageOnglets onglets={[
      { key: "factures", label: "Commandes & factures d'achat", visible: actif && hasAnyPermission(["achats", "depenses"]), element: <Achats /> },
      { key: "fournisseurs", label: "Fournisseurs", visible: actif && hasAnyPermission(["fournisseurs", "achats"]), element: <Fournisseurs /> },
    ]} />
  );
};

/** Statistiques : atelier, ventes, vue globale (toutes boutiques) */
export const StatistiquesHub = () => {
  const { hasAnyPermission, hasModule, isAllBoutiques, espaceActif } = useAuth();
  return (
    <PageOnglets defaut={espaceActif === "commerce" ? "ventes" : "atelier"} onglets={[
      { key: "atelier", label: "Atelier", visible: hasModule("atelier") && hasAnyPermission(["statistiques", "rapports"]), element: <Statistiques /> },
      { key: "ventes", label: "Ventes", visible: hasModule("commercial") && hasAnyPermission(["rapport_commercial", "rapports"]), element: <RapportCommercial /> },
      { key: "global", label: "Vue globale", visible: hasModule("commercial") && isAllBoutiques && hasAnyPermission(["statistiques", "rapports", "rapport_commercial"]), element: <VueGlobale /> },
    ]} />
  );
};

/** Catalogue : famille → catégorie → objet → marque → modèle */
export const CatalogueHub = () => {
  const { hasPermission } = useAuth();
  return (
    <PageOnglets onglets={[
      { key: "familles", label: "1. Familles", visible: hasPermission("familles"), element: <FamillesCRUD /> },
      { key: "categories", label: "2. Catégories", visible: hasPermission("categories"), element: <CategoriesCRUD /> },
      { key: "objets", label: "3. Objets", visible: hasPermission("objets"), element: <ObjetsCRUD /> },
      { key: "marques", label: "4. Marques", visible: hasPermission("marques"), element: <MarquesCRUD /> },
      { key: "modeles", label: "5. Modèles", visible: hasPermission("modeles"), element: <ModelesCRUD /> },
    ]} />
  );
};

/** ✅ Fin de journée : 1. compter et fermer la caisse, 2. clôturer la journée */
const EtapesFinDeJournee = ({ avecCaisse }) => {
  const [caisse, setCaisse] = useState(undefined); // undefined = inconnu, null = fermée
  useEffect(() => {
    if (!avecCaisse) return;
    getCaisseCourante().then((r) => setCaisse(r.data.data || null)).catch(() => setCaisse(undefined));
  }, [avecCaisse]);
  const ouverte = !!caisse;
  const etape = (n, actif, fait, icone, titre, texte) => (
    <div className={`fdj-etape ${actif ? "actif" : ""} ${fait ? "fait" : ""}`}>
      <div className="fdj-num">{fait ? <FaCheckCircle /> : n}</div>
      <div>
        <div className="fdj-titre">{icone} {titre}</div>
        <div className="fdj-texte">{texte}</div>
      </div>
    </div>
  );
  return (
    <div className="fdj-etapes">
      {avecCaisse && etape(1, ouverte, caisse === null, <FaCashRegister />, "Fermer la caisse",
        ouverte ? `Caisse ${caisse.numero} ouverte : comptez les espèces puis fermez-la (onglet Caisse).` : caisse === null ? "Caisse fermée." : "Comptez les espèces puis fermez la caisse.")}
      {etape(avecCaisse ? 2 : 1, !ouverte, false, <FaLock />, "Clôturer la journée",
        ouverte ? "Possible une fois la caisse fermée." : "Fige les chiffres du jour (onglet Clôtures). Une journée clôturée ne se modifie plus sans réouverture.")}
    </div>
  );
};

export const FinDeJourneeHub = () => {
  const { hasAnyPermission, hasModule } = useAuth();
  const avecCaisse = hasModule("commercial") && hasAnyPermission(["caisse", "clotures_rouvrir"]);
  return (
    <PageOnglets
      entete={<EtapesFinDeJournee avecCaisse={avecCaisse} />}
      onglets={[
        { key: "caisse", label: "1. Caisse", visible: avecCaisse, element: <Caisse /> },
        { key: "clotures", label: avecCaisse ? "2. Clôtures" : "Clôtures", visible: hasAnyPermission(["clotures", "clotures_rouvrir"]), element: <Clotures /> },
      ]}
    />
  );
};
