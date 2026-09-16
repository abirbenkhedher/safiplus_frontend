import React, { useEffect, useRef, useState } from 'react';
import {
  FaCamera,
  FaTimes,
  FaRedo,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExchangeAlt,
  FaLightbulb
} from 'react-icons/fa';

import {
  BrowserMultiFormatReader,
  BrowserCodeReader
} from '@zxing/browser';

const IMEIScanner = ({
  onScan,
  onClose,
  title = "Scanner l'IMEI",
  subtitle = "Pointez la caméra vers le code-barres"
}) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const lastScannedRef = useRef('');
  const mountedRef = useRef(true);

  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedValue, setScannedValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [devices, setDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState('Initialisation...');

  // =========================================================
  // STOP SCANNER
  // =========================================================

  const stopCamera = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    } catch (err) {
      console.warn('Erreur arrêt scanner:', err);
    }

    try {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    } catch (err) {
      console.warn('Erreur reset reader:', err);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Erreur arrêt track:', err);
        }
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setTorchOn(false);
    setHasTorch(false);
  };

  // =========================================================
  // BEEP
  // =========================================================

  const beep = () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const audioCtx = new AudioContext();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 1000;

      gainNode.gain.setValueAtTime(
        0.3,
        audioCtx.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.15
      );

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      setTimeout(() => {
        audioCtx.close().catch(() => {});
      }, 300);
    } catch (err) {
      console.warn('Bip impossible:', err);
    }
  };

  // =========================================================
  // HANDLE BARCODE
  // =========================================================

  const handleBarcodeDetected = (result) => {
    if (!result || !mountedRef.current) return;

    const text = result.getText();

    if (!text) return;

    // Éviter les détections multiples
    if (text === lastScannedRef.current) {
      return;
    }

    lastScannedRef.current = text;

    console.log(
      '✅ Code détecté:',
      text,
      '| Format:',
      result.getBarcodeFormat()
    );

    setDebugInfo(`✅ Code détecté : ${text}`);
    setScannedValue(text);
    setShowSuccess(true);

    beep();

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Arrêter immédiatement le scanner
    stopCamera();

    /*
     * IMPORTANT :
     * onScan() envoie la valeur au formulaire parent.
     */
    setTimeout(() => {
      if (mountedRef.current && typeof onScan === 'function') {
        onScan(text);
      }
    }, 300);
  };

  // =========================================================
  // START SCANNER
  // =========================================================

  const startScanning = async (deviceId = null) => {
    try {
      setError('');
      setShowSuccess(false);
      setScannedValue('');
      setScanning(true);
      setDebugInfo('Ouverture de la caméra...');

      lastScannedRef.current = '';

      // Nettoyage précédent
      stopCamera();

      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Votre navigateur ne permet pas l’accès à la caméra.'
        );
      }

      // =====================================================
      // LECTEUR ZXING
      // =====================================================

      const reader = new BrowserMultiFormatReader();

      readerRef.current = reader;

      // =====================================================
      // LISTE DES CAMÉRAS
      // =====================================================

      let videoDevices = [];

      try {
        videoDevices =
          await BrowserCodeReader.listVideoInputDevices();
      } catch (err) {
        console.warn(
          'Impossible de récupérer les caméras:',
          err
        );
      }

      if (!mountedRef.current) return;

      setDevices(videoDevices);

      // =====================================================
      // CHOIX DE LA CAMÉRA
      // =====================================================

      let selectedDeviceId = deviceId;

      if (!selectedDeviceId && videoDevices.length > 0) {
        /*
         * Sur téléphone :
         * essayer de choisir la caméra arrière.
         */
        const environmentCamera = videoDevices.find(
          (device) =>
            /back|rear|environment|arrière/i.test(
              device.label || ''
            )
        );

        selectedDeviceId =
          environmentCamera?.deviceId ||
          videoDevices[0]?.deviceId;
      }

      setDebugInfo('Demande d’accès à la caméra...');

      // =====================================================
      // CONTRAINTES
      // =====================================================

      let constraints;

      if (selectedDeviceId) {
        constraints = {
          video: {
            deviceId: {
              exact: selectedDeviceId
            },
            width: {
              ideal: 1920
            },
            height: {
              ideal: 1080
            },
            facingMode: {
              ideal: 'environment'
            }
          },
          audio: false
        };
      } else {
        constraints = {
          video: {
            facingMode: {
              ideal: 'environment'
            },
            width: {
              ideal: 1920
            },
            height: {
              ideal: 1080
            }
          },
          audio: false
        };
      }

      // =====================================================
      // DEMARRAGE DU SCANNER
      // =====================================================

      const controls =
        await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, decodeError) => {
            if (!mountedRef.current) return;

            if (result) {
              handleBarcodeDetected(result);
              return;
            }

            /*
             * Les erreurs de décodage sont normales :
             * ZXing essaie continuellement de lire l'image.
             */
          }
        );

      if (!mountedRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;

      // =====================================================
      // STREAM
      // =====================================================

      if (videoRef.current?.srcObject) {
        streamRef.current =
          videoRef.current.srcObject;

        const track =
          streamRef.current.getVideoTracks()[0];

        if (track) {
          const capabilities =
            track.getCapabilities?.();

          if (capabilities?.torch) {
            setHasTorch(true);
          }
        }
      }

      setScanning(true);
      setDebugInfo(
        'Caméra active — recherche du code-barres...'
      );

    } catch (err) {
      console.error('❌ Erreur scanner:', err);

      if (!mountedRef.current) return;

      stopCamera();

      let message =
        'Impossible de démarrer le scanner.';

      const errorName = (
        err?.name ||
        ''
      ).toLowerCase();

      const errorMessage = (
        err?.message ||
        ''
      ).toLowerCase();

      if (
        errorName.includes('notallowed') ||
        errorMessage.includes('permission')
      ) {
        message =
          'Accès à la caméra refusé. Autorisez la caméra dans votre navigateur.';
      } else if (
        errorName.includes('notfound')
      ) {
        message =
          'Aucune caméra détectée sur cet appareil.';
      } else if (
        errorName.includes('notreadable')
      ) {
        message =
          'La caméra est déjà utilisée par une autre application.';
      } else if (
        errorName.includes('overconstrained')
      ) {
        message =
          'La caméra sélectionnée n’est pas disponible. Essayez une autre caméra.';
      } else if (
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost'
      ) {
        message =
          'La caméra nécessite HTTPS (ou localhost pendant le développement).';
      } else {
        message =
          err?.message ||
          'Erreur inconnue lors de l’ouverture de la caméra.';
      }

      setError(message);
      setDebugInfo('Erreur');
      setScanning(false);
    }
  };

  // =========================================================
  // INITIALISATION
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    startScanning();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  // =========================================================
  // SWITCH CAMERA
  // =========================================================

  const switchCamera = async () => {
    if (devices.length < 2) return;

    const nextIndex =
      (currentDeviceIndex + 1) %
      devices.length;

    setCurrentDeviceIndex(nextIndex);

    await startScanning(
      devices[nextIndex].deviceId
    );
  };

  // =========================================================
  // TORCHE
  // =========================================================

  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) {
      return;
    }

    try {
      const track =
        streamRef.current.getVideoTracks()[0];

      if (!track) return;

      const newState = !torchOn;

      await track.applyConstraints({
        advanced: [
          {
            torch: newState
          }
        ]
      });

      setTorchOn(newState);
    } catch (err) {
      console.error(
        'Erreur activation torche:',
        err
      );
    }
  };

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    stopCamera();

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // =========================================================
  // RETRY
  // =========================================================

  const handleRetry = () => {
    setError('');
    setShowSuccess(false);
    setScannedValue('');
    lastScannedRef.current = '';

    startScanning();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '540px',
          width: '100%',
          overflow: 'hidden',
          boxShadow:
            '0 25px 50px rgba(0,0,0,0.4)',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          style={{
            padding: '16px 20px',
            background:
              'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background:
                  'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaCamera />
            </div>

            <div>
              <h5
                style={{
                  margin: 0,
                  fontSize: '15.5px',
                  fontWeight: '700',
                  color: 'white'
                }}
              >
                {title}
              </h5>

              <p
                style={{
                  fontSize: '11.5px',
                  color:
                    'rgba(255,255,255,0.85)',
                  margin: '2px 0 0'
                }}
              >
                {subtitle}
              </p>
            </div>

          </div>

          <div
            style={{
              display: 'flex',
              gap: '6px'
            }}
          >

            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                title="Activer le flash"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: torchOn
                    ? 'rgba(255,193,7,0.9)'
                    : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaLightbulb size={13} />
              </button>
            )}

            {devices.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                title="Changer de caméra"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    'rgba(255,255,255,0.15)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaExchangeAlt size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              title="Fermer"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background:
                  'rgba(255,255,255,0.15)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTimes />
            </button>

          </div>
        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1
          }}
        >

          {/* ERROR */}
          {error ? (

            <div>

              <div
                style={{
                  padding: '20px',
                  background:
                    'var(--danger-light)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}
              >

                <FaExclamationTriangle
                  size={32}
                  style={{
                    color: 'var(--danger)',
                    marginBottom: '12px'
                  }}
                />

                <div
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--danger)',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}
                >
                  Impossible d'accéder à la caméra
                </div>

                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--danger)',
                    opacity: 0.9,
                    lineHeight: 1.5
                  }}
                >
                  {error}
                </div>

              </div>

              <div
                style={{
                  padding: '14px 16px',
                  background: 'var(--gray-50)',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}
              >

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--gray-700)',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  💡 Solutions
                </div>

                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '12.5px',
                    color: 'var(--gray-600)',
                    lineHeight: 1.8
                  }}
                >
                  <li>
                    Autorisez la caméra dans le navigateur
                  </li>
                  <li>
                    Fermez les applications utilisant la caméra
                  </li>
                  <li>
                    Utilisez Chrome ou Edge récent
                  </li>
                  <li>
                    En production, utilisez HTTPS
                  </li>
                </ul>

              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >

                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-modern btn-modern-outline"
                  style={{
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  <FaTimes /> Fermer
                </button>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="btn-modern btn-modern-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  <FaRedo /> Réessayer
                </button>

              </div>

            </div>

          ) : showSuccess ? (

            /* SUCCESS */
            <div
              style={{
                padding: '40px 20px',
                background:
                  'var(--success-light)',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >

              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background:
                    'var(--success)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '28px'
                }}
              >
                <FaCheckCircle />
              </div>

              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--success)',
                  marginBottom: '8px'
                }}
              >
                Code scanné !
              </div>

              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--gray-800)',
                  padding: '10px 16px',
                  background: 'white',
                  borderRadius: '8px',
                  border:
                    '2px solid var(--success)',
                  display: 'inline-block',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {scannedValue}
              </div>

            </div>

          ) : (

            /* CAMERA */
            <>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}
              >

                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  playsInline
                  muted
                  autoPlay
                />

                {/* ZONE DE VISÉE */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform:
                      'translate(-50%, -50%)',
                    width: '88%',
                    height: '30%',
                    border:
                      '3px solid #10b981',
                    borderRadius: '12px',
                    boxShadow:
                      '0 0 0 9999px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                />

                {/* COINS */}
                <div
                  style={{
                    position: 'absolute',
                    top: '35%',
                    left: '6%',
                    width: '28px',
                    height: '28px',
                    borderTop:
                      '4px solid #10b981',
                    borderLeft:
                      '4px solid #10b981',
                    borderRadius:
                      '8px 0 0 0',
                    pointerEvents: 'none',
                    zIndex: 11
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '35%',
                    right: '6%',
                    width: '28px',
                    height: '28px',
                    borderTop:
                      '4px solid #10b981',
                    borderRight:
                      '4px solid #10b981',
                    borderRadius:
                      '0 8px 0 0',
                    pointerEvents: 'none',
                    zIndex: 11
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    bottom: '35%',
                    left: '6%',
                    width: '28px',
                    height: '28px',
                    borderBottom:
                      '4px solid #10b981',
                    borderLeft:
                      '4px solid #10b981',
                    borderRadius:
                      '0 0 0 8px',
                    pointerEvents: 'none',
                    zIndex: 11
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    bottom: '35%',
                    right: '6%',
                    width: '28px',
                    height: '28px',
                    borderBottom:
                      '4px solid #10b981',
                    borderRight:
                      '4px solid #10b981',
                    borderRadius:
                      '0 0 8px 0',
                    pointerEvents: 'none',
                    zIndex: 11
                  }}
                />

                {/* LIGNE SCAN */}
                <div
                  style={{
                    position: 'absolute',
                    left: '8%',
                    right: '8%',
                    height: '3px',
                    background: '#10b981',
                    boxShadow:
                      '0 0 15px #10b981, 0 0 30px #10b981',
                    animation:
                      'scanLine 2s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 12
                  }}
                />

                {/* BADGE */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '6px 12px',
                    background:
                      'rgba(16, 185, 129, 0.9)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 13
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'white',
                      animation:
                        'pulse 1.5s infinite'
                    }}
                  />

                  {scanning
                    ? 'Détection...'
                    : 'Initialisation...'}
                </div>

              </div>

              {/* DEBUG */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--gray-600)',
                  fontFamily: 'monospace',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}
              >
                {debugInfo}
              </div>

              {/* INFO */}
              <div
                style={{
                  padding: '12px 16px',
                  background:
                    'var(--primary-light)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--primary)',
                    fontWeight: '500'
                  }}
                >
                  📱 Tenez le code-barres{' '}
                  <strong>
                    face à la caméra
                  </strong>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--primary)',
                    opacity: 0.8,
                    marginTop: '4px'
                  }}
                >
                  Distance : 10-15 cm • Bon éclairage
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% {
            top: 35%;
          }

          50% {
            top: 65%;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }

          50% {
            opacity: 0.4;
          }
        }

        @keyframes popIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default IMEIScanner;