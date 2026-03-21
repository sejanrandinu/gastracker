import { onRequestGet as __api_stations_js_onRequestGet } from "D:\\SER Tech\\fuel and gas tracking system\\gastracker\\functions\\api\\stations.js"
import { onRequestPost as __api_update_js_onRequestPost } from "D:\\SER Tech\\fuel and gas tracking system\\gastracker\\functions\\api\\update.js"

export const routes = [
    {
      routePath: "/api/stations",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_stations_js_onRequestGet],
    },
  {
      routePath: "/api/update",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_update_js_onRequestPost],
    },
  ]