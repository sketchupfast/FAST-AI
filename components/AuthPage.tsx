
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      login(email);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 mb-2">
                FAST AI Image Editor
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Log in to start editing.
            </p>
        </header>
        <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">
              Welcome Back
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter any password to continue"
                />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-transform transform hover:scale-105"
                >
                  Log In
                </button>
              </div>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-400">
              Need an account? Please contact the creator.
            </p>
        </div>
        <footer className="text-center py-4 mt-8">
          <p className="text-gray-500">Powered by Gemini 2.5 Flash Image</p>
        </footer>
    </div>
  );
};

export default AuthPage;
