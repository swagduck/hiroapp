"use client";

import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  elementId: string;
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  fps?: number;
  qrbox?: number;
  disableFlip?: boolean;
}

export default function QrScanner({ 
  elementId, 
  onScanSuccess, 
  onScanFailure, 
  fps = 10, 
  qrbox = 250,
  disableFlip = false
}: QrScannerProps) {
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let html5QrCode: Html5Qrcode;
    
    html5QrCode = new Html5Qrcode(elementId);
    
    const startCamera = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps, qrbox: { width: qrbox, height: qrbox }, disableFlip },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            if (onScanFailure) {
              onScanFailure(errorMessage);
            }
          }
        );
      } catch (err) {
        console.error("Camera start error:", err);
        setCameraError("Vui lòng cho phép truy cập Camera để quét mã.");
      }
    };
    
    startCamera();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      } else if (html5QrCode) {
        html5QrCode.clear();
      }
    };
  }, [elementId, onScanSuccess, onScanFailure, fps, qrbox, disableFlip]);

  if (cameraError) {
    return <p className="text-amber-500 text-center font-medium p-4">{cameraError}</p>;
  }

  return (
    <div id={elementId} className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl [&_video]:object-cover"></div>
  );
}
