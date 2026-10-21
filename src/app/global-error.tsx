"use client";

// Last resort when the root layout itself fails. Plain markup: the app's styles may not have loaded.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#f7f6f2", color: "#1c1b18", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Cleared didn’t load</h1>
          <p style={{ color: "#6b675e", marginBottom: 20 }}>Nothing was sent to PayPal. Please try again.</p>
          <button onClick={reset} style={{ padding: "10px 18px", borderRadius: 8, border: 0, background: "#1c1b18", color: "#fff", fontSize: 15, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
