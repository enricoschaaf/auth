import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB } from "aws-sdk"
import { createAccessToken } from "../utils/createAccessToken"

const tableName = process.env.TABLE_NAME
const privatKey = process.env.PRIVAT_KEY
const dynamo = new DynamoDB.DocumentClient()

const refreshHandler: APIGatewayProxyHandlerV2 = async ({ pathParameters }) => {
  try {
    if (!pathParameters?.tokenId) throw Error
    const { tokenId } = pathParameters
    const { Items } = await dynamo
      .query({
        TableName: tableName,
        IndexName: "GSI1",
        ProjectionExpression: "refreshToken, confirmed, userId",
        KeyConditionExpression: "GSI1PK = :pk AND GSI1SK < :sk",
        ExpressionAttributeValues: {
          ":pk": "ID#" + tokenId,
          ":sk": "CREATED_AT#" + (Date.now() + 600),
        },
      })
      .promise()
    if (!Items) throw Error
    const { refreshToken, confirmed, userId } = Items[0]
    if (!confirmed) throw Error
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      cookies: [
        `refreshToken=${refreshToken}; Secure; HttpOnly; SameSite=Strict; Max-Age=2147483647; Path=/`,
      ],
      body: JSON.stringify({
        accessToken: createAccessToken(userId, privatKey),
      }),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
    }
  }
}

exports.handler = refreshHandler
