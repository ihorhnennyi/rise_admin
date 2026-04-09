export type MediaMention = {
  _id: string
  titleUk: string
  titleEn?: string
  excerptUk?: string
  excerptEn?: string
  imageUrl: string | null
  /** ISO string from API */
  publishedAt?: string
  href: string
  createdAt?: string
  updatedAt?: string
}
