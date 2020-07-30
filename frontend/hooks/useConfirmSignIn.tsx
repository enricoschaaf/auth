import axios from "axios"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useMutation } from "react-query"

async function confirmSignIn({ confirm }) {
  const { data } = await axios.post("/api/confirm", { confirm })
  return data
}

export function useConfirmSignOut() {
  const {
    query: { confirm }
  } = useRouter()

  const [mutation, { status }] = useMutation(confirmSignIn)

  useEffect(() => {
    if (typeof confirm === "string") {
      mutation({ confirm })
    }
  }, [confirm, mutation])

  return { status }
}