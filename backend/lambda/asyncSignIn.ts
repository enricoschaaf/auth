import { Handler } from "aws-lambda"
import { DynamoDB, SES } from "aws-sdk"
import { nanoid } from "nanoid"

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()

const ses = new SES()

async function getUserId(email: string) {
  const { Items } = await dynamo
    .query({
      TableName: tableName,
      IndexName: "GSI1",
      ProjectionExpression: "userId",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: {
        ":pk": "EMAIL#" + email,
        ":sk": "PROFILE",
      },
    })
    .promise()
  if (Items.length > 0) {
    const { userId } = Items[0]
    return userId
  }
}

function createUser(userId: string, email: string) {
  return dynamo
    .put({
      TableName: tableName,
      Item: {
        PK: "USER#" + userId,
        SK: "PROFILE",
        GSI1PK: "EMAIL#" + email,
        GSI1SK: "PROFILE",
        type: "PROFILE",
        userId,
        email,
      },
    })
    .promise()
}

function updateToken(refreshToken: string, userId: string) {
  return dynamo
    .update({
      TableName: tableName,
      Key: { PK: "TOKEN#" + refreshToken, SK: "TOKEN#" + refreshToken },
      UpdateExpression: "SET userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    })
    .promise()
}

function sendEmail(email: string, confirm: string) {
  return ses
    .sendEmail({
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Data: "auth.enricoschaaf.com/confirm/" + confirm,
          },
          Text: {
            Data: "auth.enricoschaaf.com/confirm/" + confirm,
          },
        },
        Subject: {
          Data: "Sign in to Auth",
        },
      },
      Source: "Enrico <noreply@enricoschaaf.com>",
    })
    .promise()
}

const asyncSignInHandler: Handler = async ({
  email,
  refreshToken,
  confirm,
}: {
  email: string
  refreshToken: string
  confirm: string
}) => {
  try {
    const userId = await getUserId(email)

    if (userId) {
      await Promise.all([
        updateToken(refreshToken, userId),
        sendEmail(email, confirm),
      ])
    } else {
      const userId = nanoid()
      await Promise.all([
        createUser(userId, email),
        updateToken(refreshToken, userId),
        sendEmail(email, confirm),
      ])
    }
  } catch (err) {
    console.error(err)
  }
}

exports.handler = asyncSignInHandler
