import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { DynamoDB } from "aws-sdk"

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()

const confirmNewEmailHandler: APIGatewayProxyHandlerV2 = async ({ body }) => {
  try {
    const { confirm } = JSON.parse(body)
    if (typeof confirm !== "string") return { statusCode: 400 }

    const { Items: Tokens } = await dynamo
      .query({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND SK < :sk",
        ExpressionAttributeValues: {
          ":pk": "CONFIRM#" + confirm,
          ":sk": "CREATED_AT#" + (Date.now() + 600),
        },
      })
      .promise()

    if (Tokens.length < 1) {
      return { statusCode: 400 }
    }

    const { newEmail, userId } = Tokens[0]

    const { Items: User } = await dynamo
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

    if (User.length > 0) {
      return { statusCode: 400 }
    }

    await dynamo
      .update({
        TableName: tableName,
        Key: { PK: "USER#" + userId, SK: "PROFILE" },
        UpdateExpression: "SET email = :newEmail, GSK1PK = :newGSK1PK",
        ExpressionAttributeValues: {
          ":newEmail": newEmail,
          ":newGSK1PK": "EMAIL#" + newEmail,
        },
      })
      .promise()

    return { statusCode: 200 }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
    }
  }
}

exports.handler = confirmNewEmailHandler
