import Title from "components/Title"
import { useSignOut } from "hooks/useSignOut"
import Link from "next/link"

const Index = () => {
  const { signOut } = useSignOut()
  return (
    <>
      <Title>Confirm your sign in</Title>
      <Link href="/signin">
        <a>Sign in</a>
      </Link>
      <button onClick={() => signOut()}>Sign out</button>
    </>
  )
}

export default Index
