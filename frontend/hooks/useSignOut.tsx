import axios from "axios"
import { useRouter } from "next/router"
import { setAccessToken } from "utils/accessToken"

export function useSignOut() {
  const { push } = useRouter()

  return {
    signOut: async () => {
      try {
        await axios.post("/api/signout")
        setAccessToken(undefined)
        push("/signin")
      } catch (err) {
        console.error(err)
      }
    }
  }
}
