const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"

function getToken() {
  return localStorage.getItem("token") ?? ""
}

export async function fetchNotifications() {
  const res = await fetch(`${BASE_URL}/notifications`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  })

  if (!res.ok) throw new Error("Error al cargar notificaciones")
  return res.json() // { total, items }
}