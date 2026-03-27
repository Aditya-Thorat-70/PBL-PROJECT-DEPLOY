import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import Loader from "./Loader";

export default function QRScanner({ onRoomDetected }) {
  const videoRef = useRef(null);
  const imageInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!cameraActive) {
      return () => {};
    }

    let isMounted = true;
    const codeReader = new BrowserQRCodeReader();

    const startCamera = async () => {
      try {
        if (!videoRef.current) return;

        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          throw new Error("No camera device found");
        }

        const preferredCamera =
          devices.find((d) => /(back|rear|environment)/i.test(d.label)) ||
          devices[0];

        controlsRef.current = await codeReader.decodeFromVideoDevice(
          preferredCamera?.deviceId,
          videoRef.current,
          (result, err, controls) => {
            if (!isMounted) return;

            if (result?.getText()) {
              const roomId = extractRoomIdFromQR(result.getText());
              if (roomId) {
                setScanning(false);
                setCameraActive(false);
                controls.stop();
                onRoomDetected(roomId);
              }
            }

            if (err) {
              // Ignore transient decode errors while scanning.
              console.warn("QR scan warning:", err.message || err);
            }
          }
        );

        if (isMounted) {
          setScanning(true);
          setError(null);
          setUploadError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access."
              : "Unable to access camera. Please check your device settings."
          );
          setScanning(false);
          setCameraActive(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      try {
        controlsRef.current?.stop?.();
      } catch {
        // Ignore cleanup failures to avoid unmount crashes.
      }
      try {
        codeReader.reset?.();
      } catch {
        // Ignore cleanup failures to avoid unmount crashes.
      }
    };
  }, [cameraActive, onRoomDetected]);

  const extractRoomIdFromQR = (data) => {
    const quickprintMatch = data.match(/quickprint:\/\/room\/([A-Z0-9]{6})/i);
    if (quickprintMatch) {
      return quickprintMatch[1].toUpperCase();
    }

    const queryMatch = data.match(/[?&]room=([A-Z0-9]{6})/i);
    if (queryMatch) {
      return queryMatch[1].toUpperCase();
    }

    return null;
  };

  const handleRetry = () => {
    setCameraActive(true);
    setScanning(true);
    setError(null);
    setUploadError(null);
  };

  const handleOpenCamera = () => {
    setCameraActive(true);
    setScanning(true);
    setError(null);
    setUploadError(null);
  };

  const handleCloseCamera = () => {
    setCameraActive(false);
    setScanning(false);
    try {
      controlsRef.current?.stop?.();
    } catch {
      // Best effort camera stop.
    }
  };

  const decodeQrFromImage = async (file) => {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read selected image"));
      reader.readAsDataURL(file);
    });

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const codeReader = new BrowserQRCodeReader();
    const result = await codeReader.decodeFromImageElement(image);

    if (!result?.getText()) {
      throw new Error("No QR code detected in image");
    }

    return result.getText();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await decodeQrFromImage(file);
      const roomId = extractRoomIdFromQR(data);
      if (!roomId) {
        setUploadError("QR detected, but it is not a valid QuickPrint room code.");
        return;
      }

      onRoomDetected(roomId);
    } catch {
      setUploadError("Could not detect QR from the image. Use a clearer screenshot/photo.");
    } finally {
      event.target.value = "";
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ❌
        </div>
        <h2 className="font-extrabold text-xl text-gray-900 mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
          Camera Access Required
        </h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          Open Camera to Scan
        </button>
        <button
          onClick={() => imageInputRef.current?.click()}
          className="ml-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
        >
          Upload QR Image
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-extrabold text-xl text-gray-900 mb-3 text-center" style={{ fontFamily: "Syne, sans-serif" }}>
        Scan QR Code
      </h2>
      <p className="text-sm text-gray-500 text-center mb-4">
        Point your camera at the QR code displayed on the PC
      </p>

      {!cameraActive ? (
        <div className="bg-gray-50 rounded-2xl p-6 text-center mb-4 border border-gray-100">
          <p className="text-sm text-gray-600 mb-4">Camera is off for privacy. Start it when ready.</p>
          <button
            onClick={handleOpenCamera}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            Open Camera to Scan
          </button>
        </div>
      ) : scanning ? (
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "1" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* Scanner overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-green-400 rounded-lg opacity-75"></div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-green-300 font-semibold">
            Scanning...
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center mb-4">
          <Loader text="Processing QR code..." />
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Make sure the QR code is clearly visible and well-lit
      </p>

      <div className="mt-3 flex justify-center">
        {cameraActive && (
          <button
            onClick={handleCloseCamera}
            className="mr-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Close Camera
          </button>
        )}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
        >
          Scan From Screenshot
        </button>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {uploadError && (
        <p className="mt-2 text-xs text-red-500 text-center">{uploadError}</p>
      )}
    </div>
  );
}
