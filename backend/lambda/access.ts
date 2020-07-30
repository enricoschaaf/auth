import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB } from "aws-sdk"
import { createAccessToken } from "../utils/createAccessToken"

const tableName = process.env.TABLE_NAME
const privatKey = process.env.PRIVAT_KEY
const dynamo = new DynamoDB.DocumentClient()

const accessHandler: APIGatewayProxyHandlerV2 = async ({ cookies }) => {
  try {
    const refreshToken = cookies
      ?.find((cookie: string) => cookie.startsWith("refreshToken"))
      ?.split("=")[1]
    if (!refreshToken) return { statusCode: 401 }
    const { Item } = await dynamo
      .get({
        TableName: tableName,
        Key: { PK: "TOKEN#" + refreshToken, SK: "TOKEN#" + refreshToken },
        ProjectionExpression: "userId",
      })
      .promise()
    const userId = Item?.userId
    if (!userId) return { statusCode: 401 }
    return {
      accessToken: createAccessToken(userId, privatKey),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}

exports.handler = accessHandler
