export const API_PATH = {
  AUTHENTICATE: {
    REGISTER: {
      API_PATH: '/users/register',
      API_KEY: 'resgister',
    },
    LOGIN: {
      API_PATH: '/auth/login',
      API_KEY: 'login',
    },
    LOGOUT: {
      API_PATH: '/auth/logout',
      API_KEY: 'logout',
    },
    REFRESH_TOKEN: {
      API_PATH: '/auth/refresh-token',
      API_KEY: 'refreshToken',
    },
  },

  USER: {
    PROFILE: {
      API_PATH: '/auth/profile',
      API_KEY: 'userProfile',
    },
  },
};
