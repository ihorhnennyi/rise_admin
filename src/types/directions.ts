export type DirectionImpactCircle = {
  titleUk: string
  titleEn: string
  excerptUk: string
  excerptEn: string
}

export type Direction = {
  _id: string
  title: string
  excerpt: string
  titleUk?: string
  titleEn?: string
  excerptUk?: string
  excerptEn?: string
  coverImageUrl: string | null
  impactCircles?: DirectionImpactCircle[]
  createdAt?: string
  updatedAt?: string
}
