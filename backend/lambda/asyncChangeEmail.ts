import { Handler } from "aws-lambda"
import { DynamoDB, SES } from "aws-sdk"
import { nanoid } from "nanoid"

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()

const ses = new SES()

function createConfirmationToken(
  newEmail: string,
  confirm: string,
  userId: string,
) {
  return dynamo
    .put({
      TableName: tableName,
      Item: {
        PK: "CONFIRM#" + confirm,
        SK: "CREATED_AT#" + Date.now(),
        type: "CHANGE_EMAIL_TOKEN",
        expires: Date.now() + 600,
        userId,
        newEmail,
      },
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
            Data: "auth.enricoschaaf.com/email/confirm/" + confirm,
          },
          Text: {
            Data: "auth.enricoschaaf.com/email/confirm/" + confirm,
          },
        },
        Subject: {
          Data: "Verify new email for Auth",
        },
      },
      Source: "Enrico <noreply@enricoschaaf.com>",
    })
    .promise()
}

const asyncChangeEmailHandler: Handler = async ({
  newEmail,
  userId,
}: {
  newEmail: string
  userId: string
}) => {
  try {
    const confirm = nanoid()
    await Promise.all([
      createConfirmationToken(newEmail, confirm, userId),
      sendEmail(newEmail, confirm),
    ])
  } catch (err) {
    console.error(err)
  }
}

exports.handler = asyncChangeEmailHandler
