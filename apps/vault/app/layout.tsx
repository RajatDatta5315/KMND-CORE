import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className="bg-black text-white">
        <body>
          <header className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <h1 className="text-xl font-bold tracking-tighter text-cyan-400">⟁ KMND</h1>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-cyan-500 text-black px-4 py-1 font-bold text-xs">JOIN KRYV</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
