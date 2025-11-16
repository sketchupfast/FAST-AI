
import React, { useState, useEffect, useMemo } from 'react';
import ImageEditor from './components/ImageEditor';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import { CogIcon } from './components/icons/CogIcon';
import { SearchIcon } from './components/icons/SearchIcon';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
    const { getAllUsers, approveUser } = useAuth();
    const [users, setUsers] = useState(() => getAllUsers());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsers(getAllUsers());
        }
    }, [isOpen, getAllUsers]);

    const handleApprove = (email: string) => {
        approveUser(email);
        setUsers(getAllUsers()); // Refresh list
    };
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-2xl border border-gray-700 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-200">Creator Panel - User Management</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold leading-none">&times;</button>
                </div>

                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                    {filteredUsers.length > 0 ? (
                        <table className="w-full text-left table-auto">
                            <thead className="bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.email} className="border-b border-gray-700 hover:bg-gray-700/30">
                                        <td className="p-3 text-sm text-gray-200 truncate" title={user.email}>{user.email}</td>
                                        <td className="p-3">
                                            {user.isApproved ? (
                                                <span className="px-2.5 py-1 text-xs font-bold text-green-200 bg-green-800 rounded-full">Approved</span>
                                            ) : (
                                                <span className="px-2.5 py-1 text-xs font-bold text-yellow-200 bg-yellow-800 rounded-full">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            {!user.isApproved && (
                                                <button 
                                                    onClick={() => handleApprove(user.email)}
                                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>No users found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const { isLoggedIn, user, logout, isAdmin } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);


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
                {isAdmin && (
                  <button 
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="p-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                    title="Admin Panel"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                )}
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
      {isAdmin && (
        <AdminPanel 
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}
    </>
  );
};

export default App;
