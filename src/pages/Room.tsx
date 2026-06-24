import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* The standalone Room route in the bundle was a fixed demo room. Here we route
   it to the real, data-driven room experience in the Stream so there is one
   consistent room surface. */
export function RoomPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/stream#room-0', { replace: true })
  }, [navigate])
  return null
}
