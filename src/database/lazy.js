import { dB } from "./index.js";

export function lazyQuery(sql) {
  return (...params) => dB.execute(sql, params);
}
