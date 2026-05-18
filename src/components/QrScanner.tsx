import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X, RefreshCw, Zap } from 'lucide-react';

interface QrScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

const SCANNER_DIV_ID = 'aura-qr-scanner';

export function QrScanner({ onResult, onClose }: QrScannerProps) {
  const scannerRef      = useRef<Html5Qrcode | null>(null);
  const firedRef        = useRef(false);
  const [error, setError]       = useState<string | null>(null);
  const [cameras, setCameras]   = useState<{ id: string; label: string }[]>([]);
  const [camIdx, setCamIdx]     = useState(0);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);

  const startCamera = async (camList: { id: string; label: string }[], idx: number) => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanning) await scanner.stop().catch(() => {});
    } catch {}

    firedRef.current = false;
    setScanning(false);

    try {
      await scanner.start(
        camList[idx].id,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          if (!firedRef.current) {
            firedRef.current = true;
            setDetected(true);
            setTimeout(() => onResult(decodedText), 400);
          }
        },
        () => {
          // NotFoundException fires every frame — suppress completely
        },
      );
      setScanning(true);
      setError(null);
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (msg.toLowerCase().includes('permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.toLowerCase().includes('not found')) {
        setError('No camera found on this device.');
      } else {
        setError('Could not start camera: ' + msg);
      }
    }
  };

  useEffect(() => {
    // verbose: false suppresses all html5-qrcode internal logs
    const scanner = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false });
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          setError('No camera found on this device.');
          return;
        }
        const list = devices.map((d) => ({ id: d.id, label: d.label || d.id }));
        setCameras(list);
        const rearIdx = list.findIndex((d) => /back|rear|environment/i.test(d.label));
        const startIdx = rearIdx >= 0 ? rearIdx : 0;
        setCamIdx(startIdx);
        startCamera(list, startIdx);
      })
      .catch((e: any) => {
        setError(e?.message ?? 'Could not access camera. Please check permissions.');
      });

    return () => {
      scanner.stop().catch(() => {}).finally(() => scanner.clear());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = async () => {
    if (cameras.length < 2) return;
    const next = (camIdx + 1) % cameras.length;
    setCamIdx(next);
    await startCamera(cameras, next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/80">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-semibold text-base">Scan Teacher's QR</span>
          {scanning && !detected && (
            <span className="text-xs text-green-400 animate-pulse ml-1">● Scanning…</span>
          )}
          {detected && (
            <span className="text-xs text-green-300 font-bold ml-1">✓ QR Detected!</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cameras.length > 1 && (
            <Button
              size="icon" variant="ghost"
              className="text-white hover:bg-white/20 h-9 w-9"
              onClick={flipCamera}
              title="Switch camera"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon" variant="ghost"
            className="text-white hover:bg-white/20 h-9 w-9"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Camera */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-black">
        {error ? (
          <div className="text-center text-white max-w-sm px-6">
            <Camera className="h-14 w-14 mx-auto mb-4 opacity-40" />
            <p className="text-sm leading-relaxed">{error}</p>
            <Button onClick={onClose} variant="secondary" className="mt-5">Close</Button>
          </div>
        ) : (
          <>
            <div
              id={SCANNER_DIV_ID}
              className="w-full max-w-md"
              style={{ minHeight: '300px' }}
            />
            {detected && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 pointer-events-none">
                <div className="bg-green-500 text-white rounded-full p-5 shadow-2xl">
                  <Zap className="h-10 w-10" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!error && (
        <div className="bg-black/80 text-white/70 text-xs text-center py-3 px-4">
          <p>Point camera at the QR on the teacher's screen • hold steady • max brightness</p>
        </div>
      )}
    </div>
  );
}