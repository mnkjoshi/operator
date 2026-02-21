import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Layout from './components/Layout'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <>
      <Helmet>
        <title>Operator - Accessible AI Assistant</title>
        <meta name="description" content="Eliminate technological barriers with accessible AI" />
      </Helmet>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
