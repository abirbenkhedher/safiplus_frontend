import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
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
import MarquesCRUD from './pages/marques/MarquesCRUD';
import ModelesCRUD from './pages/modeles/ModelesCRUD';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ✅ ROUTES PUBLIQUES (avant tout, hors ProtectedRoute) */}
          <Route path="/login" element={<Login />} />
          <Route path="/suivi/:numero" element={<SuiviPublic />} />

          {/* ✅ ROUTES PROTÉGÉES (avec Layout) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard - accessible à tous */}
            <Route path="dashboard" element={<Dashboard />} />

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
                  <MarquesCRUD/>
                </ProtectedRoute>
              }
            />

            <Route
              path="modeles"
              element={
                <ProtectedRoute permission="modeles">
                  <ModelesCRUD/>
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;