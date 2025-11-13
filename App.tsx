
import React from 'react';
import ImageEditor from './components/ImageEditor';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <main className="container mx-auto px-4 py-8">
          <header className="relative text-center mb-8 flex flex-col items-center">
              <div className="absolute top-0 right-0 flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-sm text-gray-400">Welcome,</span>
                  <p className="font-semibold text-gray-200 truncate max-w-[150px]">{user?.email}</p>
                </div>
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>

              <div className="relative mt-16 sm:mt-0">
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 mb-2">
                    FAST AI
                </h1>
              </div>
            <p className="mt-2 text-lg text-gray-400">
              Transform your photos with the power of AI. Just upload an image and tell us what you want to change.
            </p>
          </header>
          <ImageEditor />
        </main>
        <footer className="text-center py-4 mt-8">
          <p className="text-gray-500">Powered by Gemini 2.5 Flash Image</p>
        </footer>
      </div>
    </>
  );
};

export default App;
