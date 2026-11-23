import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ReparationModalProvider } from "./context/ReparationModalContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DialogHost from "./components/common/DialogHost";
import HomeRedirect from "./components/common/HomeRedirect";
import Layout from "./components/layout/Layout";
import ChargementPage from "./components/common/ChargementPage";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/theme.css";
import { setupRefreshDetection } from "./utils/filterStorage";
// ✅ NOUVEAU : Stock & Dépenses
// ✅ MULTI-TENANT
// ✅ Module atelier (cahier des charges V1.1)
// ✅ Gestion commerciale

// ✅ Pages chargées à la demande : le premier chargement ne télécharge que la page affichée
const Login = lazy(() => import("./pages/Login/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const StatusesCRUD = lazy(() => import("./pages/Statuses/StatusesCRUD"));
const ClientsList = lazy(() => import("./pages/Clients/ClientsList"));
const ClientDetail = lazy(() => import("./pages/Clients/ClientDetail"));
const ReparationsList = lazy(() => import("./pages/Reparations/ReparationsList"));
const ReparationDetail = lazy(() => import("./pages/Reparations/ReparationDetail"));
const UsersCRUD = lazy(() => import("./pages/Users/UsersCRUD"));
const HistoryView = lazy(() => import("./pages/History/HistoryView"));
const SuiviPublic = lazy(() => import("./pages/Reparations/SuiviPublic"));
const PannesCRUD = lazy(() => import("./pages/pannes/PannesCRUD"));
const ZonesCRUD = lazy(() => import("./pages/Zone/ZonesCRUD"));
const DepensesList = lazy(() => import("./pages/Depenses/DepensesList"));
const BoutiquesCRUD = lazy(() => import("./pages/Boutiques/BoutiquesCRUD"));
const OrganisationsCRUD = lazy(() => import("./pages/Organisations/OrganisationsCRUD"));
const ChoixBoutique = lazy(() => import("./pages/ChoixBoutique/ChoixBoutique"));
const ParametresAtelier = lazy(() => import("./pages/Atelier/ParametresAtelier"));
const Remuneration = lazy(() => import("./pages/Atelier/Remuneration"));
const MaRemuneration = lazy(() => import("./pages/Atelier/MaRemuneration"));
const MonDashboard = lazy(() => import("./pages/MonDashboard/MonDashboard"));
const Ventes = lazy(() => import("./pages/Commercial/Ventes"));
const Reglements = lazy(() => import("./pages/Commercial/Reglements"));
const Comptoir = lazy(() => import("./pages/Commercial/Comptoir"));
const DashboardCommerce = lazy(() => import("./pages/Commercial/DashboardCommerce"));
// ✅ Pages à onglets (Stock, Achats, Statistiques, Catalogue, Fin de journée)
const StockHub = lazy(() => import("./pages/Hubs/Hubs").then((m) => ({ default: m.StockHub })));
const AchatsHub = lazy(() => import("./pages/Hubs/Hubs").then((m) => ({ default: m.AchatsHub })));
const StatistiquesHub = lazy(() => import("./pages/Hubs/Hubs").then((m) => ({ default: m.StatistiquesHub })));
const CatalogueHub = lazy(() => import("./pages/Hubs/Hubs").then((m) => ({ default: m.CatalogueHub })));
const FinDeJourneeHub = lazy(() => import("./pages/Hubs/Hubs").then((m) => ({ default: m.FinDeJourneeHub })));

setupRefreshDetection();

function App() {
  return (
    <AuthProvider>
      <Router>
        <ReparationModalProvider>
          <Suspense fallback={<ChargementPage />}>
          <Routes>
            {/* ✅ ROUTES PUBLIQUES */}
            <Route path="/login" element={<Login />} />
            <Route path="/suivi/:numero" element={<SuiviPublic />} />
            <Route path="/s/:token" element={<SuiviPublic />} />

            {/* ✅ MULTI-TENANT : choix de la boutique après connexion */}
            <Route
              path="/choisir-boutique"
              element={
                <ProtectedRoute chooser>
                  <ChoixBoutique />
                </ProtectedRoute>
              }
            />

            {/* ✅ ROUTES PROTÉGÉES (avec Layout) */}
            <Route
              path="/"
              element={
                <ProtectedRoute layout>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* ✅ Accueil : dashboard, ou réparations sans la permission "dashboard" */}
              <Route index element={<HomeRedirect />} />

              <Route
                path="dashboard"
                element={
                  <ProtectedRoute permission="dashboard" redirectHome>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ✅ STATISTIQUES : réservé à l'ADMIN */}
              <Route
                path="statistiques"
                element={
                  <ProtectedRoute anyPermission={["statistiques", "rapports", "rapport_commercial"]}>
                    <StatistiquesHub />
                  </ProtectedRoute>
                }
              />

              {/* Clients */}
              <Route
                path="clients"
                element={
                  <ProtectedRoute permission="clients">
                    <ClientsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clients/:id"
                element={
                  <ProtectedRoute permission="clients">
                    <ClientDetail />
                  </ProtectedRoute>
                }
              />

              {/* Réparations */}
              <Route
                path="reparations"
                element={
                  <ProtectedRoute module="atelier" permission="reparations">
                    <ReparationsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reparations/:id"
                element={
                  <ProtectedRoute module="atelier" permission="reparations">
                    <ReparationDetail />
                  </ProtectedRoute>
                }
              />

              {/* ✅ NOUVEAU : Stock (ADMIN + REPARATEUR) */}
              <Route
                path="stock"
                element={
                  <ProtectedRoute anyPermission={["stock", "stock:read"]}>
                    <StockHub />
                  </ProtectedRoute>
                }
              />

              {/* ✅ NOUVEAU : Dépenses (ADMIN uniquement) */}
              <Route
                path="depenses"
                element={
                  <ProtectedRoute permission="depenses">
                    <DepensesList />
                  </ProtectedRoute>
                }
              />

              {/* Configuration */}
              <Route
                path="catalogue"
                element={
                  <ProtectedRoute anyPermission={["familles", "categories", "objets", "marques", "modeles"]}>
                    <CatalogueHub />
                  </ProtectedRoute>
                }
              />
              <Route path="familles" element={<Navigate to="/catalogue?onglet=familles" replace />} />
              <Route path="categories" element={<Navigate to="/catalogue?onglet=categories" replace />} />
              <Route path="objets" element={<Navigate to="/catalogue?onglet=objets" replace />} />
              <Route
                path="statuses"
                element={
                  <ProtectedRoute module="atelier" permission="statuses">
                    <StatusesCRUD />
                  </ProtectedRoute>
                }
              />
              <Route path="marques" element={<Navigate to="/catalogue?onglet=marques" replace />} />
              <Route path="modeles" element={<Navigate to="/catalogue?onglet=modeles" replace />} />
              <Route
                path="pannes"
                element={
                  <ProtectedRoute module="atelier" anyPermission={["pannes", "pannes:read"]}>
                    <PannesCRUD />
                  </ProtectedRoute>
                }
              />

              {/* ✅ ZONES — permission zones (ou clients) */}
              <Route
                path="zones"
                element={
                  <ProtectedRoute anyPermission={["zones", "clients"]}>
                    <ZonesCRUD />
                  </ProtectedRoute>
                }
              />

              {/* Administration */}
              <Route
                path="users"
                element={
                  <ProtectedRoute permission="users">
                    <UsersCRUD />
                  </ProtectedRoute>
                }
              />
              {/* ✅ MULTI-TENANT : boutiques (propriétaire) */}
              <Route
                path="boutiques"
                element={
                  <ProtectedRoute owner>
                    <BoutiquesCRUD />
                  </ProtectedRoute>
                }
              />

              {/* ✅ MULTI-TENANT : organisations (super admin) */}
              <Route
                path="organisations"
                element={
                  <ProtectedRoute superAdmin>
                    <OrganisationsCRUD />
                  </ProtectedRoute>
                }
              />

              {/* ✅ Module atelier */}
              <Route path="parametres-atelier" element={<ProtectedRoute permission="parametres_atelier"><ParametresAtelier /></ProtectedRoute>} />
              <Route path="achats" element={<ProtectedRoute module="achats" anyPermission={["achats", "depenses", "fournisseurs"]}><AchatsHub /></ProtectedRoute>} />
              <Route path="fournisseurs" element={<Navigate to="/achats?onglet=fournisseurs" replace />} />
              <Route path="stock-operations" element={<Navigate to="/stock?onglet=operations" replace />} />
              <Route path="remuneration" element={<ProtectedRoute module="atelier" anyPermission={["remuneration", "remuneration_autrui", "remuneration_regles", "commissions_valider", "paiements_reparateurs"]}><Remuneration /></ProtectedRoute>} />
              <Route path="ma-remuneration" element={<ProtectedRoute><MaRemuneration /></ProtectedRoute>} />
              {/* ✅ Tableau de bord personnel (réparateur / commercial ; l'admin choisit l'employé) */}
              <Route path="mon-tableau-de-bord" element={<ProtectedRoute permission="mon_dashboard"><MonDashboard /></ProtectedRoute>} />
              {/* ✅ Fin de journée : caisse puis clôture (commune aux deux espaces) */}
              <Route path="fin-de-journee" element={<ProtectedRoute anyPermission={["caisse", "clotures", "clotures_rouvrir"]}><FinDeJourneeHub /></ProtectedRoute>} />
              <Route path="clotures" element={<Navigate to="/fin-de-journee?onglet=clotures" replace />} />
              {/* ✅ Rapports atelier : onglet des Statistiques atelier (ancienne adresse conservée) */}
              <Route path="rapports" element={<Navigate to="/statistiques?tab=rapports" replace />} />
              {/* ✅ Gestion commerciale */}
              <Route path="commerce" element={<ProtectedRoute module="commercial" anyPermission={["rapport_commercial", "rapports", "ventes", "ventes:read"]}><DashboardCommerce /></ProtectedRoute>} />
              <Route path="vue-globale" element={<Navigate to="/statistiques?onglet=global" replace />} />
              <Route path="caisse" element={<Navigate to="/fin-de-journee?onglet=caisse" replace />} />
              <Route path="rapport-commercial" element={<Navigate to="/statistiques?onglet=ventes" replace />} />
              <Route path="comptoir" element={<ProtectedRoute module="commercial" anyPermission={["comptoir", "ventes"]}><Comptoir /></ProtectedRoute>} />
              <Route path="ventes" element={<ProtectedRoute module="commercial" anyPermission={["ventes", "ventes:read"]}><Ventes /></ProtectedRoute>} />
              <Route path="reglements" element={<ProtectedRoute module="commercial" anyPermission={["reglements", "ventes", "ventes:read"]}><Reglements /></ProtectedRoute>} />

              <Route
                path="history"
                element={
                  <ProtectedRoute permission="history">
                    <HistoryView />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ✅ Fallback */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
          </Suspense>
          {/* ✅ Boîtes de confirmation / saisie / information (design ConfirmDialog) */}
          <DialogHost />
        </ReparationModalProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;