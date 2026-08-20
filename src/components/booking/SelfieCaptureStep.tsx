"use client";

import { useEffect, useRef, useState } from "react";

export default function SelfieCaptureStep({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraReady(true);
      })
      .catch(() => {
        setCameraError("Camera access is required for selfie verification. Please allow camera permission and reload the page.");
      });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedFile(new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
        setCapturedUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9
    );
  }

  function handleRetake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedFile(null);
  }

  function handleContinue() {
    if (capturedFile) onSubmit(capturedFile);
  }

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">3. Selfie Verification</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Take a live photo of yourself — this can&apos;t be uploaded from your gallery, it must be
        captured right now.
      </p>

      {cameraError && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{cameraError}</p>
      )}

      <div className="mt-5 flex flex-col items-center">
        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-midnight/5">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${capturedUrl ? "hidden" : ""}`}
          />
          {capturedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedUrl} alt="Captured selfie" className="h-full w-full object-cover" />
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-5 flex gap-3">
          {!capturedUrl ? (
            <button
              onClick={handleCapture}
              disabled={!cameraReady}
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
            >
              Capture Photo
            </button>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
              >
                Retake
              </button>
              <button
                onClick={handleContinue}
                disabled={saving}
                className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
              >
                {saving ? "Verifying…" : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
