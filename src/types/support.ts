export type SupportPaymentMethod = {
  titleUk: string
  titleEn: string
  anchorId: string
  wide: boolean
}

export type SupportBankBlock = {
  titleUk: string
  titleEn: string
  organizationName: string
  edrpou: string
  iban: string
}

export type SupportPageConfig = {
  heroTitleUk: string
  heroTitleEn: string
  quickDonateLabelUk: string
  quickDonateLabelEn: string
  paymentMethods: SupportPaymentMethod[]
  formSectionTitleUk: string
  formSectionTitleEn: string
  presetAmounts: number[]
  qrCaptionUk: string
  qrCaptionEn: string
  qrImageUrl: string | null
  bankSectionTitleUk: string
  bankSectionTitleEn: string
  bankBlocks: SupportBankBlock[]
  termsCheckboxUk: string
  termsCheckboxEn: string
  donateButtonLabelUk: string
  donateButtonLabelEn: string
}
