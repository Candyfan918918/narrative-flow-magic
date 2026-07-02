import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from '@/compat/router'
import { EyeDefs } from './components/EyeDefs'
import { LandingPage } from './pages/Landing'

const StreamPage = React.lazy(() => import('./pages/Stream').then(m => ({ default: m.StreamPage })))
const WelcomePage = React.lazy(() => import('./pages/Welcome').then(m => ({ default: m.WelcomePage })))
const HallOfFamePage = React.lazy(() => import('./pages/HallOfFame').then(m => ({ default: m.HallOfFamePage })))
const RoomPage = React.lazy(() => import('./pages/Room').then(m => ({ default: m.RoomPage })))
const ProfilePage = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.ProfilePage })))
const AdminPage = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminPage })))
const AdminFeedbackPage = React.lazy(() => import('./pages/AdminFeedback').then(m => ({ default: m.AdminFeedbackPage })))
const MirrorPage = React.lazy(() => import('./pages/Mirror').then(m => ({ default: m.MirrorPage })))
const AdminRelateQueuePage = React.lazy(() => import('./pages/AdminRelateQueue').then(m => ({ default: m.AdminRelateQueuePage })))
const SubscribePage = React.lazy(() => import('./pages/Subscribe').then(m => ({ default: m.SubscribePage })))
const SubscribeReturnPage = React.lazy(() => import('./pages/Subscribe').then(m => ({ default: m.SubscribeReturnPage })))
const LegalPage = React.lazy(() => import('./pages/Legal').then(m => ({ default: m.LegalPage })))

export function App() {
  return (
    <>
      {/* eye-mascot gradients, injected once for every eye SVG in the app */}
      <EyeDefs />
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#fdf0f5' }} />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/stream" element={<StreamPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/halls" element={<HallOfFamePage />} />
          <Route path="/room" element={<RoomPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
          <Route path="/admin/relate-queue" element={<AdminRelateQueuePage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/subscribe/return" element={<SubscribeReturnPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/mirror" element={<MirrorPage />} />
          <Route path="*" element={<Navigate to="/stream" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
