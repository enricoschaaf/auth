import * as apiGateway from "@aws-cdk/aws-apigatewayv2"
import * as dynamo from "@aws-cdk/aws-dynamodb"
import * as iam from "@aws-cdk/aws-iam"
import * as lambda from "@aws-cdk/aws-lambda-nodejs"
import * as cdk from "@aws-cdk/core"
import { readFileSync } from "fs"

export class AuthBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const authTable = new dynamo.Table(this, "authTable", {
      partitionKey: {
        name: "PK",
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamo.AttributeType.STRING,
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiresAt",
    })

    authTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GSI1PK",
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: dynamo.AttributeType.STRING,
      },
    })

    authTable.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "GSI2PK",
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI2SK",
        type: dynamo.AttributeType.STRING,
      },
    })

    const asyncSignInLambda = new lambda.NodejsFunction(
      this,
      "asyncSignInLambda",
      {
        entry: "lambda/asyncSignIn.ts",
        environment: {
          TABLE_NAME: authTable.tableName,
        },
      },
    )
    authTable.grant(
      asyncSignInLambda,
      "dynamodb:Query",
      "dynamodb:PutItem",
      "dynamodb:BatchWriteItem",
    )
    asyncSignInLambda.addToRolePolicy(
      new iam.PolicyStatement({ resources: ["*"], actions: ["ses:SendEmail"] }),
    )

    const signInLambda = new lambda.NodejsFunction(this, "signInLambda", {
      entry: "lambda/signIn.ts",
      environment: {
        FUNCTION_NAME: asyncSignInLambda.functionName,
      },
    })
    asyncSignInLambda.grantInvoke(signInLambda)

    const signOutLambda = new lambda.NodejsFunction(this, "signOutLambda", {
      entry: "lambda/signOut.ts",
      environment: {
        TABLE_NAME: authTable.tableName,
      },
    })
    authTable.grant(signOutLambda, "dynamodb:DeleteItem")

    const refreshLambda = new lambda.NodejsFunction(this, "refreshLambda", {
      entry: "lambda/refresh.ts",
      environment: {
        TABLE_NAME: authTable.tableName,
        PRIVAT_KEY: readFileSync("private.pem").toString(),
      },
    })
    authTable.grant(refreshLambda, "dynamodb:Query")

    const confirmLambda = new lambda.NodejsFunction(this, "confirmLambda", {
      entry: "lambda/confirm.ts",
      environment: {
        TABLE_NAME: authTable.tableName,
      },
    })
    authTable.grant(confirmLambda, "dynamodb:Query", "dynamodb:UpdateItem")

    const accessLambda = new lambda.NodejsFunction(this, "accessLambda", {
      entry: "lambda/access.ts",
      environment: {
        TABLE_NAME: authTable.tableName,
        PRIVAT_KEY: readFileSync("private.pem").toString(),
      },
    })
    authTable.grant(accessLambda, "dynamodb:GetItem")

    const authApi = new apiGateway.HttpApi(this, "authApi")

    authApi.addRoutes({
      path: "/signin",
      methods: [apiGateway.HttpMethod.POST],
      integration: new apiGateway.LambdaProxyIntegration({
        handler: signInLambda,
      }),
    })

    authApi.addRoutes({
      path: "/signout",
      methods: [apiGateway.HttpMethod.POST],
      integration: new apiGateway.LambdaProxyIntegration({
        handler: signOutLambda,
      }),
    })

    authApi.addRoutes({
      path: "/refresh/{tokenId}",
      methods: [apiGateway.HttpMethod.GET],
      integration: new apiGateway.LambdaProxyIntegration({
        handler: refreshLambda,
      }),
    })

    authApi.addRoutes({
      path: "/confirm",
      methods: [apiGateway.HttpMethod.POST],
      integration: new apiGateway.LambdaProxyIntegration({
        handler: confirmLambda,
      }),
    })

    authApi.addRoutes({
      path: "/access",
      methods: [apiGateway.HttpMethod.GET],
      integration: new apiGateway.LambdaProxyIntegration({
        handler: accessLambda,
      }),
    })
  }
}
