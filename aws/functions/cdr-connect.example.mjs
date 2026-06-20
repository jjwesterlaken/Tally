// ----------------------------------------------------------------------------
// EXAMPLE backend handler — CDR / Open Banking "connect" via Basiq.
// Deploy behind API Gateway (path POST /cdr/connect) with a Cognito authorizer.
// This is illustrative: confirm current endpoints/fields against Basiq's docs,
// and only run it once you have a Basiq account + an approved CDR access model.
//
// The secret API key lives HERE (server-side), never in the browser. The handler
// returns a hosted consent URL; the app redirects the user to their bank to
// approve. Tally never sees the user's banking password.
// ----------------------------------------------------------------------------

const BASIQ_API_KEY = process.env.BASIQ_API_KEY; // set in Lambda env / Secrets Manager

export const handler = async (event) => {
  try {
    // 1. Identify the caller from the verified Cognito JWT (API Gateway authorizer).
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) return resp(401, { error: "unauthorized" });

    // 2. Get a server token from Basiq using your secret key.
    const tokenRes = await fetch("https://au-api.basiq.io/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + BASIQ_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: "scope=SERVER_ACCESS",
    });
    const { access_token } = await tokenRes.json();

    // 3. Create (or look up) a Basiq user mapped to this Cognito user, then
    //    create a consent/auth_link and return its hosted URL.
    const userRes = await fetch("https://au-api.basiq.io/users", {
      method: "POST",
      headers: { Authorization: "Bearer " + access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ email: event.email || `${userId}@example.com` }),
    });
    const basiqUser = await userRes.json();

    const linkRes = await fetch(`https://au-api.basiq.io/users/${basiqUser.id}/auth_link`, {
      method: "POST",
      headers: { Authorization: "Bearer " + access_token, "Content-Type": "application/json" },
    });
    const link = await linkRes.json();

    // 4. Persist basiqUser.id against this Cognito user (DynamoDB) so later you
    //    can fetch their accounts/transactions. (Omitted here for brevity.)

    return resp(200, { consentUrl: link.links?.public || link.url });
  } catch (e) {
    return resp(500, { error: String(e) });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
