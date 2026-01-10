export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    const { method, url } = event.node.req;
    console.info(`[req] ${method} ${url}`);
  });

  nitroApp.hooks.hook("render:response", (response, { event }) => {
    const { method, url } = event.node.req;
    console.info(`[res] ${method} ${url} -> ${response.statusCode}`);
  });

  nitroApp.hooks.hook("error", (error, { event }) => {
    const { method, url } = event?.node?.req || {};
    console.error(`[error] ${method || "unknown"} ${url || ""} ->`, error);
  });
});
