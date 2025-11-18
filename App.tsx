


import React from 'react';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <main className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <div>
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