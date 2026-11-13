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
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import FamillesCRUD from "./pages/Familles/FamillesCRUD";
import CategoriesCRUD from "./pages/Categories/CategoriesCRUD";
import ObjetsCRUD from "./pages/Objets/ObjetsCRUD";
import StatusesCRUD from "./pages/Statuses/StatusesCRUD";
import ClientsList from "./pages/Clients/ClientsList";
import ClientDetail from "./pages/Clients/ClientDetail";
import ReparationsList from "./pages/Reparations/ReparationsList";
import ReparationDetail from "./pages/Reparations/ReparationDetail";
import UsersCRUD from "./pages/Users/UsersCRUD";
import HistoryView from "./pages/History/HistoryView";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/theme.css";
import SuiviPublic from "./pages/Reparations/SuiviPublic";
import MarquesCRUD from "./pages/marques/MarquesCRUD";
import ModelesCRUD from "./pages/modeles/ModelesCRUD";
import PannesCRUD from "./pages/pannes/PannesCRUD";
import Statistiques from "./pages/Statistiques/Statistiques";
import { setupRefreshDetection } from "./utils/filterStorage";
import ZonesCRUD from "./pages/Zone/ZonesCRUD";
// ✅ NOUVEAU : Stock & Dépenses
import StockList from "./pages/Stock/StockList";
import DepensesList from "./pages/Depenses/DepensesList";
// ✅ MULTI-TENANT
import BoutiquesCRUD from "./pages/Boutiques/BoutiquesCRUD";
import OrganisationsCRUD from "./pages/Organisations/OrganisationsCRUD";
import ChoixBoutique from "./pages/ChoixBoutique/ChoixBoutique";
// ✅ Module atelier (cahier des charges V1.1)
import ParametresAtelier from "./pages/Atelier/ParametresAtelier";
import Fournisseurs from "./pages/Atelier/Fournisseurs";
import Achats from "./pages/Atelier/Achats";
import Remuneration from "./pages/Atelier/Remuneration";
import MaRemuneration from "./pages/Atelier/MaRemuneration";
import MonDashboard from "./pages/MonDashboard/MonDashboard";
import Clotures from "./pages/Atelier/Clotures";
import StockOperations from "./pages/Atelier/StockOperations";
// ✅ Gestion commerciale
import Ventes from "./pages/Commercial/Ventes";
import Reglements from "./pages/Commercial/Reglements";
import Comptoir from "./pages/Commercial/Comptoir";
import Caisse from "./pages/Commercial/Caisse";
import RapportCommercial from "./pages/Commercial/RapportCommercial";
import DashboardCommerce from "./pages/Commercial/DashboardCommerce";
import VueGlobale from "./pages/Commercial/VueGlobale";

setupRefreshDetection();

function App() {
  return (
    <AuthProvider>
      <Router>
        <ReparationModalProvider>
          <Routes>
            {/* ✅ ROUTES PUBLIQUES */}
            <Route path="/login" element={<Login />} />
            <Route path="/suivi/:numero" element={<SuiviPublic />} />

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
                  <ProtectedRoute anyPermission={["statistiques", "rapports"]}>
                    <Statistiques />
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
                  <ProtectedRoute permission="reparations">
                    <ReparationsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reparations/:id"
                element={
                  <ProtectedRoute permission="reparations">
                    <ReparationDetail />
                  </ProtectedRoute>
                }
              />

              {/* ✅ NOUVEAU : Stock (ADMIN + REPARATEUR) */}
              <Route
                path="stock"
                element={
                  <ProtectedRoute anyPermission={["stock", "stock:read"]}>
                    <StockList />
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
                path="familles"
                element={
                  <ProtectedRoute permission="familles">
                    <FamillesCRUD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <ProtectedRoute permission="categories">
                    <CategoriesCRUD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="objets"
                element={
                  <ProtectedRoute permission="objets">
                    <ObjetsCRUD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="statuses"
                element={
                  <ProtectedRoute permission="statuses">
                    <StatusesCRUD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="marques"
                element={
                  <ProtectedRoute permission="marques">
                    <MarquesCRUD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="modeles"
                element={
                  <ProtectedRoute permission="modeles">
                    <ModelesCRUD />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pannes"
                element={
                  <ProtectedRoute anyPermission={["pannes", "pannes:read"]}>
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
              <Route path="fournisseurs" element={<ProtectedRoute anyPermission={["fournisseurs", "achats"]}><Fournisseurs /></ProtectedRoute>} />
              <Route path="achats" element={<ProtectedRoute anyPermission={["achats", "depenses"]}><Achats /></ProtectedRoute>} />
              <Route path="stock-operations" element={<ProtectedRoute permission="stock"><StockOperations /></ProtectedRoute>} />
              <Route path="remuneration" element={<ProtectedRoute anyPermission={["remuneration", "remuneration_autrui", "remuneration_regles", "commissions_valider", "paiements_reparateurs"]}><Remuneration /></ProtectedRoute>} />
              <Route path="ma-remuneration" element={<ProtectedRoute><MaRemuneration /></ProtectedRoute>} />
              {/* ✅ Tableau de bord personnel (réparateur / commercial ; l'admin choisit l'employé) */}
              <Route path="mon-tableau-de-bord" element={<ProtectedRoute permission="mon_dashboard"><MonDashboard /></ProtectedRoute>} />
              <Route path="clotures" element={<ProtectedRoute anyPermission={["clotures", "clotures_rouvrir"]}><Clotures /></ProtectedRoute>} />
              {/* ✅ Rapports atelier : onglet des Statistiques atelier (ancienne adresse conservée) */}
              <Route path="rapports" element={<Navigate to="/statistiques?tab=rapports" replace />} />
              {/* ✅ Gestion commerciale */}
              <Route path="commerce" element={<ProtectedRoute module="commercial" anyPermission={["rapport_commercial", "rapports", "ventes", "ventes:read"]}><DashboardCommerce /></ProtectedRoute>} />
              <Route path="vue-globale" element={<ProtectedRoute module="commercial" anyPermission={["statistiques", "rapports", "rapport_commercial"]}><VueGlobale /></ProtectedRoute>} />
              <Route path="caisse" element={<ProtectedRoute module="commercial" anyPermission={["caisse", "clotures_rouvrir"]}><Caisse /></ProtectedRoute>} />
              <Route path="rapport-commercial" element={<ProtectedRoute module="commercial" anyPermission={["rapport_commercial", "rapports"]}><RapportCommercial /></ProtectedRoute>} />
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
          {/* ✅ Boîtes de confirmation / saisie / information (design ConfirmDialog) */}
          <DialogHost />
        </ReparationModalProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;