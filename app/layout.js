import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

// Correct way to read keys for both browser + server (Vercel)
const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY;

export const metadata = {
  title: "MoneyTracker",
  description: "Track your money with ease",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body
          style={{
            margin: 0,
            backgroundColor: "#1B1311", // dark aesthetic brown
            color: "#FFEDEE", // soft light pinkish
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {/* Header */}
          <header
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "1rem 1.5rem",
              gap: "1rem",
              height: "4rem",
              borderBottom: "1px solid #3B2520",
              background:
                "linear-gradient(90deg, rgba(36,23,23,0.95), rgba(75,50,43,0.95))",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <SignedOut>
              <SignInButton>
                <button
                  style={{
                    backgroundColor: "transparent",
                    color: "#FFB3C6",
                    borderRadius: "999px",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    border: "1px solid #FF8FAB",
                  }}
                >
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton>
                <button
                  style={{
                    background: "linear-gradient(135deg, #FF8FAB, #FFB3C6)",
                    color: "#3B2520",
                    borderRadius: "999px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    padding: "0.5rem 1.25rem",
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 6px 18px rgba(255,143,171,0.35)",
                  }}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      borderRadius: "999px",
                    },
                  },
                }}
              />
            </SignedIn>
          </header>

          {/* Page content */}
          <main
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "2.5rem 1.5rem 3rem",
            }}
          >
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}