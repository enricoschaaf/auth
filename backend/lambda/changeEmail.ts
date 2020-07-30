import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB, Lambda } from "aws-sdk"
import { verify } from "jsonwebtoken"
import { isEmail } from "../utils/isEmail"

const tableName = process.env.TABLE_NAME
const publicKey = process.env.PUBLIC_KEY
const functionName = process.env.FUNCTION_NAME
const dynamo = new DynamoDB.DocumentClient()
const lambda = new Lambda()

function getAccessToken(headers: { [name: string]: string }) {
  const { authorization } = headers
  if (!authorization) return { statusCode: 401 }
  const accessToken = authorization.split(" ")[1]
  return { accessToken }
}

const changeEmailHandler: APIGatewayProxyHandlerV2 = async ({
  headers,
  body,
}) => {
  try {
    const { accessToken } = getAccessToken(headers)
    const { userId }: any = verify(accessToken, publicKey)
    const { newEmail } = JSON.parse(body)

    if (!isEmail(newEmail)) {
      return { statusCode: 400 }
    }

    const { Items } = await dynamo
      .query({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues: {
          ":pk": "EMAIL#" + newEmail,
          ":sk": "PROFILE",
        },
      })
      .promise()

    if (Items.length > 0) {
      return {
        statusCode: 400,
      }
    }

    await lambda
      .invoke({
        FunctionName: functionName,
        Payload: JSON.stringify({ newEmail, userId }),
        InvocationType: "Event",
      })
      .promise()

    return { statusCode: 200 }
  } catch (err) {
    console.error(err)
    return { statusCode: 500 }
  }
}

exports.handler = changeEmailHandler
