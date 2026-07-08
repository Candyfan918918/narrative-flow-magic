/* Native React admin feedback page. Replaces the former iframe port of
 * public/shutap/Shutap-Feedback-Admin.dc.html (a compiled Claude Design
 * bundle). Renders the same feedback dashboard the Admin shell shows
 * under its "feedback" tab. */
import { useNoIndex } from '@/components/NoIndex'
import { AdminShell } from '@/pages/Admin'

export function AdminFeedbackPage() {
  useNoIndex()
  return <AdminShell initialView="feedback" />
}
