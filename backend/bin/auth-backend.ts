import * as cdk from "@aws-cdk/core"
import "source-map-support/register"
import { AuthBackendStack } from "../lib/auth-backend-stack"

const app = new cdk.App()
new AuthBackendStack(app, "AuthBackendStack")
