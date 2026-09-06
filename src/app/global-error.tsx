"use client";

// Last-resort boundary for an error thrown in the root layout itself, where
// error.tsx cannot help because the layout (and so the header, footer and
// fonts) never rendered. It must supply its own html and body.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F7F5",
          color: "#101828",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Nedi Hires Solutions</h1>
          <p style={{ marginTop: "0.75rem", color: "#475467", lineHeight: 1.6 }}>
            The site failed to load. This is a fault on our side. Please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              background: "#C8992E",
              color: "#101828",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#667085" }}>
            Or call us on +254 794 772 271.
          </p>
        </div>
      </body>
    </html>
  );
}
