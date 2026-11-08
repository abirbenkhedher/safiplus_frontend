import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ✅ Redirige vers la page d'accueil de l'utilisateur
// (tableau de bord, ou liste des réparations s'il n'a pas la permission "dashboard")
const HomeRedirect = () => {
  const { homePath } = useAuth();
  return <Navigate to={homePath()} replace />;
};

export default HomeRedirect;
