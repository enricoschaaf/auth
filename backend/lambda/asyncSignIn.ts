import { Handler } from "aws-lambda"
import { DynamoDB, SES } from "aws-sdk"
import { nanoid } from "nanoid"

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()
const ses = new SES()

const asyncSignInHandler: Handler = async ({
  email,
  tokenId,
}: {
  email: string
  tokenId: string
}) => {
  try {
    const confirm = nanoid()
    const refreshToken = nanoid()

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

    if (Items && Items.length > 0 && Items[0].userId) {
      await dynamo
        .put({
          TableName: tableName,
          Item: {
            PK: "TOKEN#" + refreshToken,
            SK: "TOKEN#" + refreshToken,
            GSI1PK: "ID#" + tokenId,
            GSI1SK: "CREATED_AT#" + Date.now(),
            GSI2PK: "CONFIRM#" + confirm,
            GSI2SK: "CREATED_AT#" + Date.now(),
            type: "TOKEN",
            expiresAt: Date.now() + 600,
            refreshToken: refreshToken,
            confirmed: false,
            userId: Items[0].userId,
          },
        })
        .promise()
    } else {
      const userId = nanoid()
      await dynamo
        .batchWrite({
          RequestItems: {
            [tableName]: [
              {
                PutRequest: {
                  Item: {
                    PK: "USER#" + userId,
                    SK: "PROFILE",
                    GSI1PK: "EMAIL#" + email,
                    GSI1SK: "PROFILE",
                    type: "PROFILE",
                    userId,
                    email,
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    PK: "TOKEN#" + refreshToken,
                    SK: "TOKEN#" + refreshToken,
                    GSI1PK: "ID#" + tokenId,
                    GSI1SK: "CREATED_AT#" + Date.now(),
                    GSI2PK: "CONFIRM#" + confirm,
                    GSI2SK: "CREATED_AT#" + Date.now(),
                    type: "TOKEN",
                    expiresAt: Date.now() + 600,
                    refreshToken,
                    confirmed: false,
                    userId,
                  },
                },
              },
            ],
          },
        })
        .promise()
    }

    await ses
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
  } catch (err) {
    console.error(err)
  }
}

exports.handler = asyncSignInHandler
