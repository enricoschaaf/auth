import axios from "axios"
import decode from "jwt-decode"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { accessToken, setAccessToken } from "utils/accessToken"

export function useAuth() {
  const { push, pathname } = useRouter()

  useEffect(() => {
    try {
      const { exp } = decode(accessToken)
      if (Date.now() / 1000 > exp) throw Error
    } catch {
      axios
        .get("/api/access")
        .then(({ data }) => {
          setAccessToken(data.accessToken)
          if (pathname === "signin") {
            push("/profile")
          }
        })
        .catch(() => {
          if (pathname !== "signin") {
            push("/signin")
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
