
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup, signupPending, setSignupPending } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignupPending(false);

    try {
      if (isLoginView) {
        if (!email || !password) {
          setError('กรุณากรอกข้อมูลให้ครบถ้วน');
          return;
        }
        login(email);
      } else {
        if (!email || !password || !confirmPassword) {
          setError('กรุณากรอกข้อมูลให้ครบถ้วน');
          return;
        }
        if (password.length < 6) {
          setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
          return;
        }
        if (password !== confirmPassword) {
          setError('รหัสผ่านไม่ตรงกัน');
          return;
        }
        signup(email);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่รู้จัก');
      }
    }
  };

  if (signupPending) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">
            ขอบคุณสำหรับการลงทะเบียน!
          </h2>
          <p className="text-gray-400">
            บัญชีของคุณถูกสร้างเรียบร้อยแล้วและกำลังรอการอนุมัติจากผู้สร้าง คุณจะสามารถเข้าสู่ระบบได้เมื่อบัญชีของคุณได้รับการอนุมัติ
          </p>
          <button
            onClick={() => setSignupPending(false)}
            className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-transform transform hover:scale-105"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 mb-2">
                FAST AI Image Editor
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              เข้าสู่ระบบหรือสร้างบัญชีเพื่อเริ่มต้นใช้งาน
            </p>
        </header>
        <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">
              {isLoginView ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีใหม่'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">อีเมล</label>
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">รหัสผ่าน</label>
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
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">ยืนยันรหัสผ่าน</label>
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
                  {isLoginView ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'}
                </button>
              </div>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-400">
              {isLoginView ? "ยังไม่มีบัญชี?" : 'มีบัญชีอยู่แล้ว?'}
              <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setSignupPending(false); }} className="ml-1 font-semibold text-red-400 hover:text-red-300">
                {isLoginView ? 'ลงทะเบียน' : 'เข้าสู่ระบบ'}
              </button>
            </p>
        </div>
        <footer className="text-center py-4 mt-8">
          <p className="text-gray-500">ขับเคลื่อนโดย Gemini 2.5 Flash Image</p>
        </footer>
    </div>
  );
};

export default AuthPage;
