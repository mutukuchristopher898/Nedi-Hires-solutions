"use client";

import { useState } from "react";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isImage(path: string) {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

const ZOOM_STEPS = [1, 1.5, 2, 3] as const;

/**
 * The uploaded document, with the two controls a reviewer actually needs.
 *
 * Rotate, because a photograph of an ID taken on a phone arrives sideways
 * often enough that it is the single most common reason a reviewer cannot
 * read a number. Zoom, because the number in question is small.
 *
 * Deliberately a plain <img> rather than next/image: these are private
 * identity documents on short-lived signed URLs, and routing them through the
 * image optimiser would put them in a CDN cache.
 */
export default function DocumentPreview({
  signedUrl,
  path,
  docType,
}: {
  signedUrl: string | null;
  path: string;
  docType: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);

  if (!signedUrl) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-lg bg-red-500/5 text-xs text-red-600 ring-1 ring-red-500/20">
        Preview unavailable
      </div>
    );
  }

  if (!isImage(path)) {
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg bg-offwhite text-xs font-semibold text-midnight/60 ring-1 ring-line transition hover:bg-midnight/5"
      >
        <span className="text-2xl">📄</span>
        Open PDF
      </a>
    );
  }

  const zoom = ZOOM_STEPS[zoomIndex];

  return (
    <div>
      {/* overflow-auto rather than hidden: zooming is pointless if the part
          you zoomed towards is then unreachable. */}
      <div className="h-40 w-full overflow-auto rounded-lg bg-midnight/5 ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedUrl}
          alt={`${docType} submitted for review`}
          style={{
            transform: `rotate(${rotation}deg) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          className="mx-auto h-40 w-auto max-w-none object-contain transition-transform"
        />
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          aria-label={`Rotate ${docType} 90 degrees`}
          className="rounded border border-line px-2 py-0.5 text-xs text-midnight/70 transition hover:bg-midnight/5"
        >
          ↻ Rotate
        </button>
        <button
          type="button"
          onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
          disabled={zoomIndex === 0}
          aria-label="Zoom out"
          className="rounded border border-line px-2 py-0.5 text-xs text-midnight/70 transition hover:bg-midnight/5 disabled:opacity-30"
        >
          −
        </button>
        <span className="text-xs tabular-nums text-midnight/50">{zoom}×</span>
        <button
          type="button"
          onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))}
          disabled={zoomIndex === ZOOM_STEPS.length - 1}
          aria-label="Zoom in"
          className="rounded border border-line px-2 py-0.5 text-xs text-midnight/70 transition hover:bg-midnight/5 disabled:opacity-30"
        >
          +
        </button>
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs font-semibold text-gold-dark hover:text-gold"
        >
          Full size
        </a>
      </div>
    </div>
  );
}
