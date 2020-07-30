import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB } from "aws-sdk"

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()

const signOutHandler: APIGatewayProxyHandlerV2 = async ({ cookies }) => {
  try {
    const refreshToken = cookies
      ?.find((cookie: string) => cookie.startsWith("refreshToken"))
      ?.split("=")[1]
    if (!refreshToken) {
      return {
        statusCode: 401,
      }
    }
    await dynamo
      .delete({
        TableName: tableName,
        Key: { SK: "REFRESH#" + refreshToken, PK: "REFRESH#" + refreshToken },
        ReturnValues: "NONE",
      })
      .promise()
    return {
      statusCode: 200,
      cookies: ["refreshToken=; Max-Age=0"],
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}

exports.handler = signOutHandler
