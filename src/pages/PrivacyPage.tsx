import { ContentPageEditor } from '@admin/pages/ContentPageEditor'

export function PrivacyPage() {
  return (
    <ContentPageEditor
      pageKey="privacy"
      pageHeading="Політика конфіденційності"
      defaultTitle="Політика конфіденційності"
      placeholder="Встав текст політики конфіденційності…"
    />
  )
}

