
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

const FilterButton: React.FC<{
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 transition-colors ${
            isActive
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
    >
        {label}
        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
            isActive ? 'bg-red-400 text-red-900' : 'bg-gray-600 text-gray-200'
        }`}>
            {count}
        </span>
    </button>
);


const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
    const { getAllUsers, approveUser } = useAuth();
    const [users, setUsers] = useState(() => getAllUsers());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');

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
        return users.filter(user => {
            const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filterStatus === 'pending') {
                return !user.isApproved;
            }
            if (filterStatus === 'approved') {
                return user.isApproved;
            }
            return true; // 'all'
        });
    }, [users, searchTerm, filterStatus]);

    const userCounts = useMemo(() => ({
        all: users.length,
        pending: users.filter(u => !u.isApproved).length,
        approved: users.filter(u => u.isApproved).length
    }), [users]);

    const emptyMessage = useMemo(() => {
        if (users.length === 0) {
            return "ยังไม่มีผู้ใช้งานลงทะเบียน";
        }
        if (searchTerm) {
            return "ไม่พบผู้ใช้งานที่ตรงกับการค้นหาของคุณ";
        }
        switch (filterStatus) {
            case 'pending':
                return "ไม่มีผู้ใช้งานที่รอการอนุมัติ";
            case 'approved':
                return "ไม่มีผู้ใช้งานที่ได้รับการอนุมัติ";
            default:
                return "ไม่พบผู้ใช้งาน";
        }
    }, [searchTerm, filterStatus, users.length]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-md md:max-w-2xl border border-gray-700 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-200">แผงควบคุม - จัดการผู้ใช้งาน</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold leading-none">&times;</button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="ค้นหาด้วยอีเมล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 bg-gray-900/50 p-1.5 rounded-full">
                         <FilterButton label="ทั้งหมด" count={userCounts.all} isActive={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
                         <FilterButton label="รออนุมัติ" count={userCounts.pending} isActive={filterStatus === 'pending'} onClick={() => setFilterStatus('pending')} />
                         <FilterButton label="อนุมัติแล้ว" count={userCounts.approved} isActive={filterStatus === 'approved'} onClick={() => setFilterStatus('approved')} />
                    </div>
                </div>


                <div className="overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                    {filteredUsers.length > 0 ? (
                        <div>
                            {/* Desktop Header */}
                            <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 p-3 bg-gray-700/50 rounded-t-lg">
                                <div className="text-sm font-semibold text-gray-300">อีเมล</div>
                                <div className="text-sm font-semibold text-gray-300">สถานะ</div>
                                <div className="text-sm font-semibold text-gray-300 text-right">คำสั่ง</div>
                            </div>
                            
                            {/* User List */}
                            <div className="flex flex-col gap-3 md:gap-0 mt-3 md:mt-0">
                                {filteredUsers.map(user => (
                                    <div 
                                        key={user.email} 
                                        className="bg-gray-900/50 rounded-lg p-4 flex flex-col gap-3
                                                   md:bg-transparent md:rounded-none md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-4 md:p-3 md:items-center 
                                                   md:border-b md:border-gray-700 md:hover:bg-gray-700/30"
                                    >
                                        {/* Email Column */}
                                        <div className="truncate">
                                            <div className="text-xs font-bold text-gray-400 md:hidden mb-1">อีเมล</div>
                                            <p className="text-sm text-gray-200 truncate" title={user.email}>{user.email}</p>
                                        </div>

                                        {/* Status Column */}
                                        <div className="">
                                            <div className="text-xs font-bold text-gray-400 md:hidden mb-1">สถานะ</div>
                                            {user.isApproved ? (
                                                <span className="px-2.5 py-1 text-xs font-bold text-green-200 bg-green-800 rounded-full">อนุมัติแล้ว</span>
                                            ) : (
                                                <span className="px-2.5 py-1 text-xs font-bold text-yellow-200 bg-yellow-800 rounded-full">รออนุมัติ</span>
                                            )}
                                        </div>

                                        {/* Action Column */}
                                        <div className="md:text-right">
                                            {!user.isApproved && (
                                                <button 
                                                    onClick={() => handleApprove(user.email)}
                                                    className="w-full md:w-auto px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    อนุมัติ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>{emptyMessage}</p>
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
                  <span className="text-sm text-gray-400">ยินดีต้อนรับ,</span>
                  <p className="font-semibold text-gray-200 truncate max-w-[150px]">{user?.email}</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="p-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                    title="แผงควบคุม"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>

              <div className="relative mt-16 sm:mt-0">
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 mb-2">
                    FAST AI
                </h1>
              </div>
            <p className="mt-2 text-lg text-gray-400">
              เปลี่ยนภาพถ่ายของคุณด้วยพลังของ AI เพียงอัปโหลดรูปภาพแล้วบอกเราว่าคุณต้องการเปลี่ยนแปลงอะไร
            </p>
          </header>
          <ImageEditor />
        </main>
        <footer className="text-center py-4 mt-8">
          <p className="text-gray-500">ขับเคลื่อนโดย Gemini 2.5 Flash Image</p>
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
