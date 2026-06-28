import { Navigate, Route, Routes } from 'react-router-dom'
import { EyeDefs } from './components/EyeDefs'
import { StreamPage } from './pages/Stream'
import { LandingPage } from './pages/Landing'
import { WelcomePage } from './pages/Welcome'
import { HallOfFamePage } from './pages/HallOfFame'
import { RoomPage } from './pages/Room'
import { ProfilePage } from './pages/Profile'
import { AdminPage } from './pages/Admin'
import { AdminFeedbackPage } from './pages/AdminFeedback'
import { AdminRelateQueuePage } from './pages/AdminRelateQueue'
import { SubscribePage, SubscribeReturnPage } from './pages/Subscribe'
import { LegalPage } from './pages/Legal'

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
        <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/subscribe/return" element={<SubscribeReturnPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="*" element={<Navigate to="/stream" replace />} />
      </Routes>
    </>
  )
}
