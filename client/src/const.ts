export const COOKIE_NAME = "auth_token";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Return local login URL for standalone auth
export const getLoginUrl = () => {
  return "/login";
};
