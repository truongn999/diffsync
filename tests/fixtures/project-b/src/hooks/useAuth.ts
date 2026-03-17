import { useState, useEffect } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = async (username: string, password: string) => {
    const result = await authenticate(username, password)
    setUser(result)
  }

  return { user, login, loading }
}

async function checkAuth() { return null }
async function authenticate(u: string, p: string) { return { name: u } }
