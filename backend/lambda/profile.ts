import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB } from "aws-sdk"
import { verify } from "jsonwebtoken"

const tableName = process.env.TABLE_NAME
const publicKey = process.env.PUBLIC_KEY
const dynamo = new DynamoDB.DocumentClient()

function getAccessToken(headers: { [name: string]: string }) {
  const { authorization } = headers
  if (!authorization) return { statusCode: 401 }
  const accessToken = authorization.split(" ")[1]
  return { accessToken }
}

const profileHandler: APIGatewayProxyHandlerV2 = async ({ headers }) => {
  try {
    const { accessToken } = getAccessToken(headers)
    const { userId }: any = verify(accessToken, publicKey)

    const {
      Item: { email },
    } = await dynamo
      .get({
        TableName: tableName,
        ProjectionExpression: "email",
        Key: { PK: "USER#" + userId, SK: "PROFILE" },
      })
      .promise()

    return { email }
  } catch (err) {
    console.error(err)
    return { statusCode: 500 }
  }
}

exports.handler = profileHandler
