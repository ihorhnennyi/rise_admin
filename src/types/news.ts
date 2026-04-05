export type News = {
  _id: string
  title: string
  excerpt: string
  titleUk?: string
  titleEn?: string
  excerptUk?: string
  excerptEn?: string
  coverImageUrl: string | null
  blocks: NewsBlock[]
  imageUrls: string[]
  createdAt?: string
  updatedAt?: string
}

export type NewsBlock =
  | { type: 'text'; textUk: string; textEn: string }
  | { type: 'quote'; quoteUk: string; quoteEn: string; authorUk?: string; authorEn?: string }
  | { type: 'image'; url: string; captionUk?: string; captionEn?: string }
  | { type: 'list'; ordered?: boolean; itemsUk: string[]; itemsEn: string[] }

