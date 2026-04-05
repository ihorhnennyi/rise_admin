export const DEFAULT_TEAM_TITLE_UK = 'Наша команда'
export const DEFAULT_TEAM_TITLE_EN = 'Our team'

export type AboutTeamMember = {
  nameUk: string
  nameEn: string
  roleUk: string
  roleEn: string
  imageUrl: string | null
}

/** Три типові учасники (тексти з макету); фото — через «Фото» після збереження. */
export const ABOUT_DEFAULT_TEAM_MEMBERS: AboutTeamMember[] = [
  {
    nameUk: 'Яна Паладієва',
    nameEn: 'Yana Paladiieva',
    roleUk: 'Співзасновниця, Виконавчий директор Фонду',
    roleEn: 'Co-founder, Executive Director',
    imageUrl: null,
  },
  {
    nameUk: 'Катерина Барбашина',
    nameEn: 'Kateryna Barbashyna',
    roleUk: 'Проджект-менеджерка',
    roleEn: 'Project Manager',
    imageUrl: null,
  },
  {
    nameUk: 'Денис Сафонов',
    nameEn: 'Denys Safonov',
    roleUk: 'Співзасновник фонду',
    roleEn: 'Co-founder',
    imageUrl: null,
  },
]
