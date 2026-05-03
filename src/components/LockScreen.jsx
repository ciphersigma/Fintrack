import { useState, useEffect, useRef, createContext, useContext } from "react";

const PIN_KEY = "fintrack_pin";
const BIOMETRIC_KEY = "fintrack_bio_cred";
const LockContext = createContext(null);
export const useLock = () => useContext(LockContext);

// Check if platform authenticator (fingerprint/face) is available
async function isBiometricAvailable() {
  try {
    if (!window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

export default function LockScreen({ children }) {
  const [locked, setLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [settingPin, setSettingPin] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(null);
  const [error, setError] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_KEY);
    const bioCred = localStorage.getItem(BIOMETRIC_KEY);
    setHasPin(!!storedPin);
    setBiometricEnabled(!!bioCred);
    if (storedPin) {
      setLocked(true);
      // Auto-trigger biometric if enabled
      if (bioCred) {
        setTimeout(() => attemptBiometric(bioCred), 300);
      }
    }
    // Check if biometric hardware is available
    isBiometricAvailable().then(setBioAvailable);
  }, []);

  useEffect(() => {
    if ((locked || settingPin) && inputRefs[0].current) {
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [locked, settingPin]);

  const attemptBiometric = async (credIdB64) => {
    const credId = credIdB64 || localStorage.getItem(BIOMETRIC_KEY);
    if (!credId) return;

    try {
      // Convert base64 credential ID back to ArrayBuffer
      const rawId = Uint8Array.from(atob(credId), (c) => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname,
          allowCredentials: [{
            id: rawId,
            type: "public-key",
            transports: ["internal"],
          }],
        },
      });

      if (assertion) {
        setLocked(false);
        setPin(["", "", "", ""]);
      }
    } catch {
      // Biometric failed or cancelled — user can enter PIN instead
    }
  };

  const setupBiometric = async () => {
    if (!bioAvailable) {
      setError("Biometric not available on this device");
      return;
    }

    try {
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: "Fintrack",
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: "fintrack-lock",
            displayName: "Fintrack Lock",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Forces device's built-in sensor
            userVerification: "required",
            residentKey: "discouraged", // Don't create a discoverable passkey
          },
          timeout: 60000,
        },
      });

      if (credential) {
        // Store the credential ID so we can use it for verification later
        const credIdB64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(BIOMETRIC_KEY, credIdB64);
        setBiometricEnabled(true);
      }
    } catch (err) {
      console.error("Biometric setup error:", err);
      setError("Biometric setup failed. Try again.");
    }
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      localStorage.removeItem(BIOMETRIC_KEY);
      setBiometricEnabled(false);
    } else {
      await setupBiometric();
    }
  };

  const handlePinInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    if (value && index < 3) inputRefs[index + 1].current?.focus();

    if (newPin.every((d) => d !== "")) {
      const entered = newPin.join("");
      if (settingPin) {
        if (!confirmPin) {
          setConfirmPin(entered);
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs[0].current?.focus(), 50);
        } else {
          if (entered === confirmPin) {
            localStorage.setItem(PIN_KEY, entered);
            setHasPin(true);
            setSettingPin(false);
            setConfirmPin(null);
            setPin(["", "", "", ""]);
          } else {
            setError("PINs don't match");
            setConfirmPin(null);
            setPin(["", "", "", ""]);
            setTimeout(() => inputRefs[0].current?.focus(), 50);
          }
        }
      } else {
        if (entered === localStorage.getItem(PIN_KEY)) {
          setLocked(false);
          setPin(["", "", "", ""]);
        } else {
          setError("Wrong PIN");
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs[0].current?.focus(), 50);
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const removePin = () => {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(BIOMETRIC_KEY);
    setHasPin(false);
    setBiometricEnabled(false);
    setLocked(false);
  };

  // ── Lock Screen ──
  if (locked || settingPin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-20 -left-16 w-48 h-48 rounded-full bg-white/5" />
        </div>

        <div className="relative text-center w-full max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">₹</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            {settingPin ? (confirmPin ? "Confirm PIN" : "Set a PIN") : "Enter PIN"}
          </h2>
          <p className="text-white/50 text-sm mb-8">
            {settingPin ? (confirmPin ? "Enter the same PIN again" : "Choose a 4-digit PIN") : "Unlock to continue"}
          </p>

          <div className="flex justify-center gap-4 mb-6">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 text-center text-white text-xl font-bold focus:border-white/60 focus:bg-white/15 outline-none transition-all"
                style={{ WebkitTextSecurity: digit ? "disc" : "none" }}
              />
            ))}
          </div>

          {error && <p className="text-rose-300 text-sm mb-4">{error}</p>}

          {!settingPin && biometricEnabled && (
            <button
              onClick={() => attemptBiometric()}
              className="px-5 py-2.5 text-sm font-medium text-white/80 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              Use Fingerprint / Face
            </button>
          )}

          {settingPin && (
            <button
              onClick={() => { setSettingPin(false); setConfirmPin(null); setPin(["", "", "", ""]); setError(""); }}
              className="mt-2 text-sm text-white/50 hover:text-white/80"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <LockContext.Provider value={{ hasPin, biometricEnabled, bioAvailable, setSettingPin, toggleBiometric, removePin }}>
      {children}
    </LockContext.Provider>
  );
}
