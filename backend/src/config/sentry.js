import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: "https://3c78ef8084e29d433a35985ce18a3b6a@o4512094582865920.ingest.de.sentry.io/4512094597021776",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  integrations: [Sentry.pinoIntegration({
    error: {
        levels: ["error", "fatal"],
        handled: true,
      },
  })],
  beforeSending: (log) => {
    if (log.request?.url?.includes("/health")) {
      return null;
    }
    return log; 
  },
});