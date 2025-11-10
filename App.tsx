
import React, { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import { ShareIcon } from './components/icons/ShareIcon';

const App: React.FC = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('คัดลอกลิงก์');

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyButtonText('คัดลอกแล้ว!');
      setTimeout(() => {
        setCopyButtonText('คัดลอกลิงก์');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('เกิดข้อผิดพลาด');
    });
  };

  const appUrl = window.location.href;
  const shareText = "ลองใช้ FAST AI Image Editor สำหรับแก้ไขภาพด้วย AI!";
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;


  return (
    <>
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsShareModalOpen(false)}>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-700 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-200 mb-4 text-center">แชร์แอปพลิเคชันนี้</h2>
                <p className="text-center text-gray-400 mb-5">ให้คนอื่นได้ลองใช้เครื่องมือแก้ไขภาพด้วย AI ที่น่าทึ่งนี้!</p>
                
                <div className="bg-gray-900 p-3 rounded-lg mb-4">
                  <input 
                    type="text" 
                    readOnly 
                    value={appUrl} 
                    className="w-full bg-transparent text-gray-300 border-none focus:ring-0 text-sm"
                  />
                </div>

                <button 
                    onClick={handleCopyToClipboard} 
                    className={`w-full px-6 py-3 mb-4 rounded-full text-sm font-semibold transition-colors ${
                      copyButtonText === 'คัดลอกแล้ว!' 
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                    {copyButtonText}
                </button>

                <div className="flex justify-center gap-4">
                    <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors">Twitter</a>
                    <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors">Facebook</a>
                </div>

                <div className="flex justify-end mt-4">
                    <button 
                        onClick={() => setIsShareModalOpen(false)} 
                        className="text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
      )}
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <main className="container mx-auto px-4 py-8">
          <header className="text-center mb-8 flex flex-col items-center">
              <div className="relative">
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 mb-2">
                    FAST AI
                </h1>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  title="แชร์แอปนี้"
                  className="absolute -top-1 -right-10 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <ShareIcon className="w-6 h-6" />
                </button>
              </div>
            <p className="mt-2 text-lg text-gray-400">
              เปลี่ยนภาพถ่ายของคุณด้วยพลังของ AI เพียงอัปโหลดรูปภาพ แล้วบอกเราว่าต้องการแก้ไขอะไร
            </p>
          </header>
          <ImageEditor />
        </main>
        <footer className="text-center py-4 mt-8">
          <p className="text-gray-500">ขับเคลื่อนโดย Gemini 2.5 Flash Image</p>
        </footer>
      </div>
    </>
  );
};

export default App;