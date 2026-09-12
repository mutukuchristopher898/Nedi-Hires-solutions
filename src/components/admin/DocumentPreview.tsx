const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isImage(path: string) {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * The uploaded identity document itself. Without this the queue asked an
 * admin to approve or reject a passport they could not see.
 *
 * Deliberately a plain <img> rather than next/image. These are private
 * identity documents on short-lived signed URLs; routing them through the
 * image optimiser would put them in a CDN cache, and the signed path isn't in
 * remotePatterns anyway. No optimisation is the correct answer here.
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
  if (!signedUrl) {
    return <span className="text-xs text-red-600">Unavailable</span>;
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs font-semibold text-gold-dark hover:text-gold"
    >
      {isImage(path) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={signedUrl}
          alt={`${docType} thumbnail`}
          className="h-12 w-16 rounded border border-line object-cover"
        />
      ) : (
        <span className="flex h-12 w-16 items-center justify-center rounded border border-line bg-offwhite text-[10px] text-midnight/50">
          PDF
        </span>
      )}
      Open
    </a>
  );
}
