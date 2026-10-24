let appInstance = null;

export default async function handler(req, res) {
  try {
    if (!appInstance) {
      const serverMod = await import('../../server/server.js');
      appInstance = serverMod.default;
    }
    return appInstance(req, res);
  } catch (err) {
    console.error('Serverless Invocation Error:', err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
}
