import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { Lambda } from "aws-sdk"
import { nanoid } from "nanoid"

const functionName = process.env.FUNCTION_NAME
const lambda = new Lambda()

async function signIn(email: string) {
  try {
    const tokenId = nanoid()
    await lambda
      .invoke({
        FunctionName: functionName,
        Payload: JSON.stringify({ email, tokenId }),
        InvocationType: "Event",
      })
      .promise()
    return { tokenId }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}

const signInHandler: APIGatewayProxyHandlerV2 = async ({ body }) => {
  try {
    if (!body) throw Error
    const { email } = JSON.parse(body)
    if (typeof email !== "string") throw Error
    if (
      RegExp(
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
      ).test(email) === false
    ) {
      throw Error
    }
    return signIn(email)
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
    }
  }
}

exports.handler = signInHandler
