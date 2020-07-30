import { SignInForm } from "components/SignInForm"
import Title from "components/Title"
import { useAuth } from "hooks/useAuth"

const SignIn = () => {
  useAuth()

  return (
    <>
      <Title>Sign in</Title>
      <SignInForm />
    </>
  )
}

export default SignIn
