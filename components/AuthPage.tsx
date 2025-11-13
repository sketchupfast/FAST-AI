
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLoginView) {
      // Basic validation
      if (!email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      // In this simulation, any login attempt for a non-empty email/pw is "successful"
      login(email);
    } else {
      // Signup validation
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      signup(email);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 mb-2">
                FAST AI Image Editor
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Log in or create an account to start editing.
            </p>
        </header>
        <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">
              {isLoginView ? 'Welcome Back' : 'Create Account'}
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
                  autoComplete={isLoginView ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {!isLoginView && (
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">Confirm Password</label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-transform transform hover:scale-105"
                >
                  {isLoginView ? 'Log In' : 'Sign Up'}
                </button>
              </div>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-400">
              {isLoginView ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="ml-1 font-semibold text-red-400 hover:text-red-300">
                {isLoginView ? 'Sign Up' : 'Log In'}
              </button>
            </p>
        </div>
        <footer className="text-center py-4 mt-8">
          <p className="text-gray-500">Powered by Gemini 2.5 Flash Image</p>
        </footer>
    </div>
  );
};

export default AuthPage;