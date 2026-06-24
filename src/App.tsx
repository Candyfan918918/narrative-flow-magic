import { Navigate, Route, Routes } from 'react-router-dom'
import { EyeDefs } from './components/EyeDefs'
import { StreamPage } from './pages/Stream'
import { LandingPage } from './pages/Landing'
import { WelcomePage } from './pages/Welcome'
import { HallOfFamePage } from './pages/HallOfFame'
import { RoomPage } from './pages/Room'
import { ProfilePage } from './pages/Profile'
import { AdminPage } from './pages/Admin'

export function App() {
  return (
    <>
      {/* eye-mascot gradients, injected once for every eye SVG in the app */}
      <EyeDefs />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/stream" element={<StreamPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/halls" element={<HallOfFamePage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/stream" replace />} />
      </Routes>
    </>
  )
}
