const axios = require('axios');

const proxy = (serviceUrl) => async (req, res) => {
  try {
    const url = `${serviceUrl}${req.originalUrl}`;

    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] }),
        ...(req.headers['x-user-role'] && { 'x-user-role': req.headers['x-user-role'] }),
        ...(req.headers['x-user-email'] && { 'x-user-email': req.headers['x-user-email'] }),
        ...(req.headers['x-user-name'] && { 'x-user-name': req.headers['x-user-name'] }),
        ...(req.headers.authorization && { authorization: req.headers.authorization }),
      },
      params: req.query,
      timeout: 10000,
      validateStatus: () => true, // forward all status codes as-is
    });

    // Forward Set-Cookie headers from downstream (e.g. jwt cookie from auth-service)
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }

    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`Proxy error to ${serviceUrl}:`, err.message);
    res.status(502).json({ status: 'error', message: 'Service unavailable' });
  }
};

module.exports = proxy;
