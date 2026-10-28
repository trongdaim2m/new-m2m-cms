export const CMS_TOKEN_COOKIE = 'm2m_cms_token';
export const CMS_USER_COOKIE = 'm2m_cms_user';

/** Prefer 127.0.0.1 on Windows — `localhost` can resolve to IPv6 first and refuse. */
export function getApiBaseUrl() {
  const raw =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  return raw.replace(/\/$/, '');
}
