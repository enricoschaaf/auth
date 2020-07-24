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
    if (!refreshToken) throw Error
    const { Item } = await dynamo
      .get({
        TableName: tableName,
        Key: { PK: "TOKEN#" + refreshToken, SK: "TOKEN#" + refreshToken },
        ProjectionExpression: "userId",
      })
      .promise()
    const userId = Item?.userId
    if (!userId) throw Error
    return {
      accessToken: createAccessToken(userId, privatKey),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
    }
  }
}

exports.handler = accessHandler
