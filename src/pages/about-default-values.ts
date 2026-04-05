export const DEFAULT_VALUES_TITLE_UK = 'Наші цінності'
export const DEFAULT_VALUES_TITLE_EN = 'Our values'

export type AboutValueItem = {
  titleUk: string
  titleEn: string
  descriptionUk: string
  descriptionEn: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  variant: 'blue' | 'gold'
  slot: number
}

/** 8 типових цінностей: розмір, колір і слот (0–7) відповідають макету на фронті. */
export const ABOUT_DEFAULT_VALUES_ITEMS: AboutValueItem[] = [
  {
    titleUk: 'Відповідальність',
    titleEn: 'Responsibility',
    descriptionUk: 'Ми відповідаємо за свої слова клієнтам і діями перед суспільством.',
    descriptionEn: '',
    size: 'md',
    variant: 'blue',
    slot: 0,
  },
  {
    titleUk: 'Ініціативність',
    titleEn: 'Initiative',
    descriptionUk: 'Ми не чекаємо — пропонуємо рішення та беремо на себе рух уперед.',
    descriptionEn: '',
    size: 'md',
    variant: 'gold',
    slot: 1,
  },
  {
    titleUk: 'Співпраця',
    titleEn: 'Collaboration',
    descriptionUk: 'Ми будуємо довіру та партнерство з тими, хто розділяє наші цінності.',
    descriptionEn: '',
    size: 'sm',
    variant: 'blue',
    slot: 2,
  },
  {
    titleUk: 'Колективне прийняття рішень',
    titleEn: 'Collective decision-making',
    descriptionUk: 'Важливі рішення узгоджуємо разом, враховуючи думку команди та експертів.',
    descriptionEn: '',
    size: 'xl',
    variant: 'gold',
    slot: 3,
  },
  {
    titleUk: 'Креативність',
    titleEn: 'Creativity',
    descriptionUk: 'Шукаємо нові підходи й не боїмося експериментувати заради кращого результату.',
    descriptionEn: '',
    size: 'sm',
    variant: 'blue',
    slot: 4,
  },
  {
    titleUk: 'Командна робота',
    titleEn: 'Teamwork',
    descriptionUk: 'Разом ми сильніші: підтримуємо одне одного та ділимося досвідом.',
    descriptionEn: '',
    size: 'lg',
    variant: 'blue',
    slot: 5,
  },
  {
    titleUk: 'Амбіційність',
    titleEn: 'Ambition',
    descriptionUk: 'Ми ставимо високі цілі й системно рухаємося до їх досягнення.',
    descriptionEn: '',
    size: 'md',
    variant: 'gold',
    slot: 6,
  },
  {
    titleUk: 'Професійність',
    titleEn: 'Professionalism',
    descriptionUk: 'Опираємося на компетентність, етику та прозорість у роботі.',
    descriptionEn: '',
    size: 'md',
    variant: 'blue',
    slot: 7,
  },
]
