import type { LucideIcon } from 'lucide-react'
import {
  CloudUpload,
  Info,
  Languages,
  LayoutPanelLeft,
  Layers,
  MonitorSmartphone,
  Sparkles,
} from 'lucide-react'

export type LocalizedString = { uk: string; en: string }

export type HelpSubsection = {
  title: LocalizedString
  paragraphs: LocalizedString[]
}

export type HelpSection = {
  id: string
  icon: LucideIcon
  title: LocalizedString
  paragraphs: LocalizedString[]
  bullets?: LocalizedString[]
  subsections?: HelpSubsection[]
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'what',
    icon: MonitorSmartphone,
    title: { uk: 'Що це за панель', en: 'What this panel is' },
    paragraphs: [
      {
        uk: 'Це внутрішня адмін-панель сайту. Тут редагується контент, який бачать відвідувачі на публічному сайті. Зміни зберігаються на сервері — після збереження оновіть головний сайт (інколи варто відкрити сторінку в режимі інкогніто, щоб обійти кеш браузера).',
        en: 'This is the site’s admin panel. Content you edit elsewhere in this panel is what visitors see on the public website. Changes are stored on the server — after saving, refresh the live site (a private window helps if the browser cache gets in the way).',
      },
    ],
  },
  {
    id: 'ui',
    icon: LayoutPanelLeft,
    title: { uk: 'Інтерфейс', en: 'Interface' },
    paragraphs: [],
    bullets: [
      {
        uk: 'Меню зліва — розділи сайту. Натисніть назву, щоб перейти до редагування.',
        en: 'Left menu — site sections. Click a label to open its editor.',
      },
      {
        uk: 'Угорі справа — перемикач теми (світла/темна), ваш email, роль (наприклад, superadmin) і кнопка виходу.',
        en: 'Top right — theme toggle, your email, role (e.g. superadmin), and logout.',
      },
      {
        uk: 'Доступ мають лише авторизовані користувачі з відповідною роллю. Якщо щось не відкривається або просить увійти знову — оновіть сторінку або увійдіть повторно.',
        en: 'Access is limited to signed-in users with the right role. If something fails or asks you to sign in again, refresh or log in once more.',
      },
    ],
  },
  {
    id: 'langs',
    icon: Languages,
    title: { uk: 'Українська та англійська (UA / EN)', en: 'Ukrainian and English (UA / EN)' },
    paragraphs: [
      {
        uk: 'У більшості форм є перемикачі UA та EN. Текст для обох мов окремо: спочатку заповніть українську версію, перемкніться на EN і введіть переклад. Якщо англійську залишити порожньою, на англомовній версії сайту можуть бути порожні поля — краще заповнювати обидві мови там, де вони використовуються на сайті.',
        en: 'Most forms have UA and EN toggles. The two languages are separate: fill Ukrainian first, switch to EN and add the translation. Empty English fields may look blank on the English site — fill both where the public site uses both.',
      },
    ],
  },
  {
    id: 'save',
    icon: CloudUpload,
    title: { uk: 'Як зберігаються зміни', en: 'How saving works' },
    paragraphs: [],
    bullets: [
      {
        uk: 'Автозбереження — після паузи в наборі тексту (близько 0,4 с) зміни можуть відправлятися на сервер автоматично. Не закривайте вкладку одразу після довгого тексту: клацніть поза полем або натисніть «Зберегти», зачекайте кілька секунд.',
        en: 'Auto-save may send changes after a short pause while typing (~0.4s). Don’t close the tab right after a long edit: click outside the field or press Save and wait a moment.',
      },
      {
        uk: 'Кнопка «Зберегти» (у шапці або внизу сторінки редагування) явно зберігає поточний стан. Якщо вона з’явилась після правок — натисніть її перед тим, як йти далі.',
        en: 'The Save button (in the header or footer of an edit page) writes the current state explicitly. If it appears after edits, use it before leaving.',
      },
      {
        uk: 'У довгих формах (наприклад, «Про фонд») блоки можна згортати — перевіряйте всі потрібні поля перед збереженням.',
        en: 'Long pages (e.g. About) may use collapsible blocks — expand and check required fields before saving.',
      },
    ],
  },
  {
    id: 'menu',
    icon: Layers,
    title: { uk: 'Розділи меню — коротко', en: 'Menu sections (short)' },
    paragraphs: [
      {
        uk: 'Нижче — що робить кожен пункт бічного меню. Деталі завжди на відповідній сторінці редагування.',
        en: 'Below is what each sidebar item is for. Full details are on each edit screen.',
      },
    ],
    subsections: [
      {
        title: { uk: 'Основна інформація', en: 'Main information' },
        paragraphs: [
          {
            uk: 'Глобальні налаштування сайту (контакти, соцмережі, логотип тощо). Зміни часто впливають на шапку, футер і елементи по всьому сайту.',
            en: 'Global site settings (contacts, social links, logo, etc.). Changes often affect the header, footer, and elements across the site.',
          },
        ],
      },
      {
        title: { uk: 'Елементи меню', en: 'Menu items' },
        paragraphs: [
          {
            uk: 'Структура верхнього меню: назви пунктів, посилання, порядок. Після змін перевірте головну сторінку.',
            en: 'Top navigation: labels, links, order. Check the homepage after changes.',
          },
        ],
      },
      {
        title: { uk: 'Футер', en: 'Footer' },
        paragraphs: [
          {
            uk: 'Контент і посилання в підвалі сайту.',
            en: 'Footer content and links.',
          },
        ],
      },
      {
        title: { uk: 'Новини', en: 'News' },
        paragraphs: [
          {
            uk: 'Список новин: створення, редагування, зображення. Зазвичай є заголовок, короткий текст, повний текст і обкладинка.',
            en: 'Create and edit news posts, cover images, and body text.',
          },
        ],
      },
      {
        title: { uk: 'Напрямки діяльності', en: 'Directions of activity' },
        paragraphs: [
          {
            uk: 'Картки на головній сторінці: заголовок, короткий опис і зображення. Тут не повна сторінка проєкту і не вибирається проєкт — лише вітрина напрямку.',
            en: 'Homepage cards: title, short description, and image. Not the full project page — you do not pick a project here.',
          },
        ],
      },
      {
        title: { uk: 'Проєкти', en: 'Projects' },
        paragraphs: [
          {
            uk: 'Повний матеріал проєкту на сайті: тексти, результати, галерея, головне зображення. У формі є «Напрямок (опційно)» — тоді картка напрямку на головній може вести на цей проєкт. Якщо кілька проєктів з одним напрямком, посилання зазвичай на найновіший. Типово: спочатку напрямок, потім проєкт із прив’язкою.',
            en: 'Full project pages: long text, results, gallery, cover. Use Direction (optional) to link from a homepage direction card. If several projects share one direction, the homepage usually links to the newest. Typical flow: create the direction, then the project with that direction.',
          },
        ],
      },
      {
        title: { uk: 'Про фонд', en: 'About the fund' },
        paragraphs: [
          {
            uk: 'Складна сторінка: блоки, цінності, команда, волонтери. Редагуйте по секціях, зберігайте після великих змін. Зображення — окремими кнопками в блоках.',
            en: 'Complex page: blocks, values, team, volunteers. Edit section by section; upload images with the buttons in each section.',
          },
        ],
      },
      {
        title: { uk: 'Партнери', en: 'Partners' },
        paragraphs: [
          {
            uk: 'Логотипи та дані партнерів для сайту.',
            en: 'Partner logos and details.',
          },
        ],
      },
      {
        title: { uk: 'Звітність та документи', en: 'Reporting and documents' },
        paragraphs: [
          {
            uk: 'Сторінка з блоком «Загальні результати»: заголовок, текст і лічильники (значення, підпис UA/EN, розмір і колір «кола»). Окремо — секція з описом і списком файлів. Документи додаються кнопкою «Створити запис»: назва, категорія з фіксованого списку (річний/місячний звіт, стратегії, установчі документи, політики), порядок сортування. Потім завантажте PDF або DOC/DOCX. Зміни в рядку зберігайте «Зберегти запис»; тексти секцій — «Зберегти» внизу екрана.',
            en: 'Page with an “Overall results” block: title, body, and stat bubbles (value, labels, size and colour). Then a section intro and downloadable files. Create rows with title, fixed category, sort order, then upload PDF/DOC/DOCX. Save each row with “Save entry”; section texts use the footer Save.',
          },
        ],
      },
      {
        title: { uk: 'Підтримати', en: 'Support / donate' },
        paragraphs: [
          {
            uk: 'Сторінка донату в окремому розділі адмінки: герой, способи оплати з якорями, пресети сум, QR, банківські картки.',
            en: 'Donate page in its own admin section: hero, payment tiles with anchors, amount presets, QR, bank cards.',
          },
        ],
      },
      {
        title: {
          uk: 'Правила, cookie, конфіденційність',
          en: 'Terms, cookie policy, privacy',
        },
        paragraphs: [
          {
            uk: 'Юридичні та інформаційні сторінки — заголовок і основний текст у двох мовах.',
            en: 'Legal / info pages — title and main body in both languages.',
          },
        ],
      },
    ],
  },
  {
    id: 'this-page',
    icon: Info,
    title: { uk: 'Про цю сторінку «Допомога»', en: 'About this Help page' },
    paragraphs: [
      {
        uk: 'Це статична довідка: текст зібраний у зручні блоки й оновлюється разом із кодом адмін-панелі. Тут немає окремого збереження в базі — усі зміни контенту сайту, як і раніше, робляться у відповідних розділах меню.',
        en: 'This is static documentation: content is shown in blocks and is updated with the admin app code. Nothing is saved from this screen — all real site edits are done in the sidebar sections as usual.',
      },
    ],
  },
  {
    id: 'tips',
    icon: Sparkles,
    title: { uk: 'Поради', en: 'Tips' },
    paragraphs: [],
    bullets: [
      {
        uk: 'Перед важливими змінами відкрийте сайт у новій вкладці й перевірте потрібну сторінку.',
        en: 'After important updates, open the live site in a new tab and verify.',
      },
      {
        uk: 'Зображення: якісні, але не завеликі файли (JPG/PNG/WEBP; на сервері може бути обмеження розміру).',
        en: 'Use reasonably sized images (JPG/PNG/WEBP; the server may enforce a max size).',
      },
      {
        uk: 'Якщо щось «зникло» після збереження — перевірте іншу мову (UA/EN) або інший розділ.',
        en: 'If content “disappeared”, check the other language (UA/EN) or another section.',
      },
    ],
  },
]
