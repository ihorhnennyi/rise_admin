export type Project = {
  _id: string
  title: string
  excerpt: string
  titleUk?: string
  titleEn?: string
  excerptUk?: string
  excerptEn?: string
  contentUk?: string
  contentEn?: string
  results?: Array<{ titleUk: string; titleEn: string; excerptUk: string; excerptEn: string }>
  imageUrls?: string[]
  coverImageUrl: string | null
  directionId?: string | null
  /** Реалізований / актуальний */
  implementationStatus?: 'implemented' | 'current' | null
  createdAt?: string
  updatedAt?: string
}
