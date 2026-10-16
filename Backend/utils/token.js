const getToken = (req) => {
  const authorizationToken = req.headers.authorization?.split(' ')[1];
  if (authorizationToken) {
    return authorizationToken;
  }

  const authCookie = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('authToken='));

  return authCookie ? authCookie.slice('authToken='.length) : null;
};

module.exports = { getToken };