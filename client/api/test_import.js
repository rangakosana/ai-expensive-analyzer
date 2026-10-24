export default async function handler(req, res) {
  try {
    const serverModule = await import('../../server/server.js');
    res.status(200).json({ success: true, hasApp: !!serverModule.default });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
}
