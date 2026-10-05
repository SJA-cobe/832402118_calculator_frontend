// Docker deployment uses the same-origin /api reverse proxy.
window.CALCULATOR_API = ['localhost', '127.0.0.1'].includes(location.hostname)
  && location.port === '5500' ? 'http://127.0.0.1:8000' : '';
