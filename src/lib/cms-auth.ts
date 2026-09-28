export const CMS_TOKEN_COOKIE = 'm2m_cms_token';
export const CMS_USER_COOKIE = 'm2m_cms_user';

export function getApiBaseUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}
