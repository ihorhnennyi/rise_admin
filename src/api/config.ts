const defaultProtocol =
  typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? 'https'
    : 'http'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.toString() ??
  `${defaultProtocol}://localhost:3000/api`

const siteUrlRaw = import.meta.env.VITE_SITE_URL
export const SITE_URL =
  typeof siteUrlRaw === 'string' ? siteUrlRaw.trim() : ''

