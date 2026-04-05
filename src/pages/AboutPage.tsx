import {
  DEFAULT_VOLUNTEER_TITLE_EN,
  DEFAULT_VOLUNTEER_TITLE_UK,
} from '@admin/pages/about-default-volunteers'
import {
  ABOUT_DEFAULT_TEAM_MEMBERS,
  DEFAULT_TEAM_TITLE_EN,
  DEFAULT_TEAM_TITLE_UK,
} from '@admin/pages/about-default-team'
import {
  ABOUT_DEFAULT_VALUES_ITEMS,
  DEFAULT_VALUES_TITLE_EN,
  DEFAULT_VALUES_TITLE_UK,
} from '@admin/pages/about-default-values'
import { ABOUT_DEFAULT_AFTER_BLOCKS } from '@admin/pages/about-default-after-blocks'
import { ContentPageEditor } from '@admin/pages/ContentPageEditor'

const ABOUT_AFTER_BLOCKS_DEFAULT = [...ABOUT_DEFAULT_AFTER_BLOCKS]
const ABOUT_VALUES_ITEMS_DEFAULT = [...ABOUT_DEFAULT_VALUES_ITEMS]
const ABOUT_TEAM_MEMBERS_DEFAULT = [...ABOUT_DEFAULT_TEAM_MEMBERS]

export function AboutPage() {
  return (
    <ContentPageEditor
      pageKey="about"
      pageHeading="Про Фонд"
      defaultTitle="Про Фонд"
      placeholder="Встав текст про фонд…"
      enableCover
      enableBlocks
      enableAfterBlocks
      defaultAfterBlocks={ABOUT_AFTER_BLOCKS_DEFAULT}
      enableValuesSection
      defaultValuesTitleUk={DEFAULT_VALUES_TITLE_UK}
      defaultValuesTitleEn={DEFAULT_VALUES_TITLE_EN}
      defaultValuesItems={ABOUT_VALUES_ITEMS_DEFAULT}
      enableTeamSection
      defaultTeamTitleUk={DEFAULT_TEAM_TITLE_UK}
      defaultTeamTitleEn={DEFAULT_TEAM_TITLE_EN}
      defaultTeamMembers={ABOUT_TEAM_MEMBERS_DEFAULT}
      enableVolunteersSection
      defaultVolunteerTitleUk={DEFAULT_VOLUNTEER_TITLE_UK}
      defaultVolunteerTitleEn={DEFAULT_VOLUNTEER_TITLE_EN}
      enableText={false}
    />
  )
}

