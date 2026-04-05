import { ContentPageEditor } from '@admin/pages/ContentPageEditor'

export function CookiesPage() {
  return (
    <ContentPageEditor
      pageKey="cookies"
      pageHeading="Політика щодо файлів cookie"
      defaultTitle="Політика щодо файлів cookie"
      placeholder="Встав текст політики cookie…"
    />
  )
}

