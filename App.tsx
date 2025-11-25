
import React from 'react';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-200 font-sans selection:bg-red-500/30">
      <ImageEditor />
    </div>
  );
};

export default App;
