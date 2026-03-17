import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)

  const login = (username: string) => {
    setUser({ name: username })
  }

  return { user, login }
}
