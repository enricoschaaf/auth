import Title from "components/Title"
import { useConfirmSignOut } from "hooks/useConfirmSignIn"

const Confirm = () => {
  const { status } = useConfirmSignOut()
  return (
    <>
      <Title>Confirm your sign in</Title>
      {status === "loading" ? (
        <div>loading</div>
      ) : status === "error" ? (
        <div>error</div>
      ) : (
        <div>success</div>
      )}
    </>
  )
}

export default Confirm
