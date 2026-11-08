import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ReparationModalProvider } from "./context/ReparationModalContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
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
                  <ProtectedRoute permission="statistiques">
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
        </ReparationModalProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;