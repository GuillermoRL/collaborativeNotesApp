import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import './App.css'

function App() {
  const { isStorageAvailable } = useLocalStorage()

  return (
    <Router>
      <div className="app">
        {!isStorageAvailable && (
          <div className="storage-warning">
            Warning: localStorage is not available. Notes will not be persisted.
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
