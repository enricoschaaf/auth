import Head from "next/head"

const Title = ({ children }: { children?: string }) => (
  <Head>
    <title>
      {children}
      {children && " | "}Auth
    </title>
  </Head>
)

export default Title
