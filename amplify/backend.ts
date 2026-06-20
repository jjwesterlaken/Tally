import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

// Deploys: Amazon Cognito (auth) + AppSync/DynamoDB (data).
defineBackend({ auth, data });
