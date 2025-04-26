export async function getServerDebugInfo() {
  const res = await fetch(process.env.BACKEND_URL ?? 'http://localhost:3001/debug')
  return await res.json()
}