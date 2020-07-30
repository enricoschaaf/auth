import axios from "axios"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { setAccessToken } from "utils/accessToken"

async function onSubmit({ email }, push) {
  try {
    const {
      data: { tokenId }
    } = await axios.post("/api/signin", {
      email
    })

    while (true) {
      const { data } = await axios.get("/api/refresh/" + tokenId)
      if (data.accessToken) {
        setAccessToken(data.accessToken)
        return push("/profile")
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export const SignInForm = () => {
  const { push } = useRouter()
  const { register, handleSubmit } = useForm()
  return (
    <form
      onSubmit={handleSubmit((data: { email: string }) => onSubmit(data, push))}
    >
      <input
        name="email"
        inputMode="email"
        placeholder="Email address"
        autoComplete="email"
        ref={register({ required: true })}
      />
      <button type="submit">Sign in</button>
    </form>
  )
}
