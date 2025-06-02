import { useState, useEffect } from 'react';
import Canvas from './Canvas';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Apply theme to root element
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('bg-gray-900', darkMode);
    root.classList.toggle('bg-white', !darkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Toolbar with dark mode toggle */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Generative Art IDE</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <SunIcon className="h-6 w-6 text-yellow-300" />
          ) : (
            <MoonIcon className="h-6 w-6 text-indigo-300" />
          )}
        </button>
      </div>

      {/* Canvas container */}
      <div className="flex-grow relative">
        <Canvas 
          width={window.innerWidth} 
          height={window.innerHeight - 64} 
          onSelectionChange={(ids) => console.log('Selected:', ids)} 
        />
      </div>

      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
