import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Game } from './pages/Game';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    // ClerkProvider wraps the whole app — gives access to useAuth() everywhere
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        {/* Nav */}
        <nav className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
          <span className="text-white font-bold">Courtside IQ</span>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              {/* Clerk's pre-built user button (avatar + dropdown) */}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}
