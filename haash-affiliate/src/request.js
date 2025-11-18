import axios from "axios";
import { getConfig } from "./config.js";

export const API = axios.create();

API.interceptors.request.use((req) => {
  const cfg = getConfig();
  req.baseURL = cfg.baseURL;
  req.headers["x-api-key"] = cfg.apiKey;
  req.headers["Content-Type"] = "application/json";
  return req;
});
