export default function handler(req, res) {
  res.status(200).json({ ping_from_client_api: true });
}
