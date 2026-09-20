import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTools, FaUser, FaLock, FaEye, FaEyeSlash, 
  FaExclamationCircle 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [globalError, setGlobalError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Validation d'un champ
  const validateField = (name, value) => {
    if (!value || !value.trim()) {
      return name === 'username' 
        ? 'Le nom d\'utilisateur est obligatoire'
        : 'Le mot de passe est obligatoire';
    }
    return '';
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    // Effacer l'erreur de ce champ quand on tape
    if (fieldErrors.username) {
      setFieldErrors({ ...fieldErrors, username: '' });
    }
    // Effacer l'erreur globale
    if (globalError) setGlobalError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors({ ...fieldErrors, password: '' });
    }
    if (globalError) setGlobalError('');
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const value = field === 'username' ? username : password;
    setFieldErrors({ ...fieldErrors, [field]: validateField(field, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setGlobalError('');

    // Valider les 2 champs
    const usernameError = validateField('username', username);
    const passwordError = validateField('password', password);

    setFieldErrors({ username: usernameError, password: passwordError });
    setTouched({ username: true, password: true });

    // Si erreurs de validation, on arrête
    if (usernameError || passwordError) {
      return;
    }

    // Appel API
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      setLoading(false);

      if (result.success) {
        navigate('/dashboard');
      } else {
        // Message d'erreur global
        setGlobalError(result.message || 'Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (err) {
      setLoading(false);
      setGlobalError('Erreur de connexion au serveur. Veuillez réessayer.');
    }
  };

  return (
    <div className="login-page">
      {/* Fond décoratif */}
      <div className="login-bg-decoration">
        <div className="login-bg-circle login-bg-circle-1" />
        <div className="login-bg-circle login-bg-circle-2" />
      </div>

      {/* Card de login */}
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
{/* ✅ Image à la place de l'icône FaWrench — même taille 40x40 */}
            <img src={logo} alt="Safi Info +" className="sidebar-logo-img" />          </div>
          <h1 className="login-title">Safi Info +</h1>
          <p className="login-subtitle">Gestion de réparation</p>
        </div>

        {/* Message d'erreur global */}
        {globalError && (
          <div className="login-alert login-alert-error">
            <FaExclamationCircle />
            <div>
              <strong>Identifiants incorrects</strong>
              <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.9 }}>
                {globalError}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate autoComplete="off">
          {/* Champ Nom d'utilisateur */}
          <div className="login-form-group">
            <label className="login-label">
              <FaUser size={11} style={{ marginRight: '6px', color: 'var(--gray-500)' }} />
              Nom d'utilisateur
            </label>
            <div className="login-input-wrapper">
              <input
                type="text"
                placeholder="Entrez votre nom d'utilisateur"
                value={username}
                onChange={handleUsernameChange}
                onBlur={() => handleBlur('username')}
                autoFocus
                autoComplete="off"
                className={`login-input ${fieldErrors.username ? 'login-input-error' : ''}`}
              />
            </div>
            {fieldErrors.username && (
              <div className="login-field-error">
                <FaExclamationCircle size={11} />
                {fieldErrors.username}
              </div>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div className="login-form-group">
            <label className="login-label">
              <FaLock size={11} style={{ marginRight: '6px', color: 'var(--gray-500)' }} />
              Mot de passe
            </label>
            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                autoComplete="off"
                className={`login-input ${fieldErrors.password ? 'login-input-error' : ''}`}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-input-toggle"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="login-field-error">
                <FaExclamationCircle size={11} />
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="btn-modern btn-modern-primary login-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Comptes démo */}
        <div className="login-demo">
          <div className="login-demo-title">Comptes de démonstration (cliquez pour remplir)</div>
          <div className="login-demo-accounts">
            {[
              { label: '👑 Admin', creds: 'admin / admin123', user: 'admin', pass: 'admin123' },
              { label: '💼 Commercial', creds: 'commercial / commercial123', user: 'commercial', pass: 'commercial123' },
              { label: '🔧 Réparateur', creds: 'reparateur / reparateur123', user: 'reparateur', pass: 'reparateur123' },
            ].map((item) => (
              <div 
                key={item.user}
                className="login-demo-item"
                onClick={() => {
                  setUsername(item.user);
                  setPassword(item.pass);
                  setTouched({ username: false, password: false });
                  setFieldErrors({ username: '', password: '' });
                  setGlobalError('');
                }}
                style={{ cursor: 'pointer' }}
                title="Cliquer pour remplir automatiquement"
              >
                <span className="login-demo-label">{item.label}</span>
                <code>{item.creds}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .login-bg-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .login-bg-circle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(67, 97, 238, 0.4), transparent);
          filter: blur(60px);
        }

        .login-bg-circle-1 {
          width: 500px;
          height: 500px;
          top: -200px;
          right: -150px;
        }

        .login-bg-circle-2 {
          width: 400px;
          height: 400px;
          bottom: -150px;
          left: -100px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), transparent);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
          animation: fadeInUp 0.5s ease-out;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #4361ee, #3a52c9);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          box-shadow: 0 12px 30px rgba(67, 97, 238, 0.4);
        }

        .login-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 4px;
        }

        .login-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .login-alert {
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          animation: shake 0.4s ease-in-out;
        }

        .login-alert svg {
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 16px;
        }

        .login-alert-error {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          color: #991b1b;
        }

        .login-alert-error svg {
          color: #ef4444;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .login-form-group {
          margin-bottom: 18px;
        }

        .login-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .login-input-wrapper {
          position: relative;
        }

        .login-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 13.5px;
          transition: all 150ms ease;
          background: white;
          font-family: inherit;
          color: #111827;
        }

        .login-input:focus {
          outline: none;
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .login-input.login-input-error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .login-input.login-input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
        }

        .login-input::placeholder {
          color: #9ca3af;
        }

        .login-field-error {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 500;
          animation: fadeIn 0.2s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-input-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 150ms ease;
        }

        .login-input-toggle:hover {
          color: #4361ee;
        }

        .login-submit-btn {
          width: 100%;
          height: 46px;
          justify-content: center;
          font-size: 14px;
          margin-top: 8px;
        }

        .login-demo {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px dashed #e5e7eb;
        }

        .login-demo-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9ca3af;
          text-align: center;
          margin-bottom: 12px;
        }

        .login-demo-accounts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-demo-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 8px;
          font-size: 12px;
          transition: all 150ms ease;
          border: 1px solid transparent;
        }

        .login-demo-item:hover {
          background: #f3f4f6;
          border-color: #e5e7eb;
          transform: translateX(2px);
        }

        .login-demo-label {
          font-weight: 600;
          color: #374151;
        }

        .login-demo-item code {
          font-size: 11px;
          color: #6b7280;
          background: white;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }

          .login-logo {
            width: 60px;
            height: 60px;
            font-size: 26px;
          }

          .login-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;