import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";

const resolver = new Resolver();

resolver.define("doResolverRequest", async ({ payload }) => {
  const result = await api
    .asUser()
    .requestJira(route`/rest/api/3/${payload.url}`, {
      method: payload.method,
      body: payload.body,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

  return result.body ? result.json() : result.body;
});

export const handler = resolver.getDefinitions();
