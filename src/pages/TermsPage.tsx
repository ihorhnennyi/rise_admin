import { ContentPageEditor } from '@admin/pages/ContentPageEditor'

export function TermsPage() {
  return (
    <ContentPageEditor
      pageKey="terms"
      pageHeading="Правила користування"
      defaultTitle="Правила користування"
      placeholder="Встав текст правил…"
    />
  )
}

