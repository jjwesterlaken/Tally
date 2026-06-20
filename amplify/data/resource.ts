import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Data model (stored in DynamoDB, served via AppSync GraphQL).
 *
 * Profile   — one per user; holds your personal bucket + settings + which
 *             household you belong to. owner() rule keeps it private to you.
 * Household — one per couple; holds the shared bucket. Starter rule below lets
 *             any signed-in user read/write so an invited partner can join via
 *             code. TIGHTEN THIS before production (e.g. a members-based group
 *             rule or a custom resolver) — see GO-LIVE.md.
 */
const schema = a.schema({
  Profile: a
    .model({
      personal: a.json(),
      settings: a.json(),
      integrations: a.json(),
      householdId: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Household: a
    .model({
      inviteCode: a.string().required(),
      members: a.string().array(),
      shared: a.json(),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: "userPool" },
});
