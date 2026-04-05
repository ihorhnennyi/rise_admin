export type ReportingStat = {
  value: string
  labelUk: string
  labelEn: string
  size: 'lg' | 'md' | 'sm'
  tone: 'yellow' | 'blue'
}

export type ReportCategoryMeta = {
  slug: string
  labelUk: string
  labelEn: string
}

export type ReportDocumentRow = {
  _id: string
  titleUk: string
  titleEn: string
  category: string
  fileUrl: string | null
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export type ReportingBundle = {
  resultsTitleUk: string
  resultsTitleEn: string
  resultsBodyUk: string
  resultsBodyEn: string
  stats: ReportingStat[]
  documentsSectionTitleUk: string
  documentsSectionTitleEn: string
  documentsSectionBodyUk: string
  documentsSectionBodyEn: string
  documents: ReportDocumentRow[]
  categories: ReportCategoryMeta[]
}
