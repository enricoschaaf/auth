import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB, Lambda } from "aws-sdk"
import { nanoid } from "nanoid"
import { isEmail } from "../utils/isEmail"

const functionName = process.env.FUNCTION_NAME
const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()
const lambda = new Lambda()

const signInHandler: APIGatewayProxyHandlerV2 = async ({ body }) => {
  try {
    if (!body) {
      return {
        statusCode: 400,
      }
    }
    const { email } = JSON.parse(body)
    if (!isEmail(email)) {
      return {
        statusCode: 400,
      }
    }
    const [refreshToken, confirm, tokenId] = [nanoid(), nanoid(), nanoid()]

    await Promise.all([
      dynamo
        .put({
          TableName: tableName,
          Item: {
            PK: "TOKEN#" + refreshToken,
            SK: "TOKEN#" + refreshToken,
            GSI1PK: "ID#" + tokenId,
            GSI1SK: "CREATED_AT#" + Date.now(),
            GSI2PK: "CONFIRM#" + confirm,
            GSI2SK: "CREATED_AT#" + Date.now(),
            type: "REFRESH_TOKEN",
            expiresAt: Date.now() + 600,
            refreshToken: refreshToken,
            confirmed: false,
          },
        })
        .promise(),
      lambda
        .invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({ email, refreshToken, confirm }),
          InvocationType: "Event",
        })
        .promise(),
    ])

    return { tokenId }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}

exports.handler = signInHandler
