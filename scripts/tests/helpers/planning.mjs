import fs from "node:fs";
import vm from "node:vm";

export const planningSource = fs.readFileSync(new URL("../../../planning.js", import.meta.url), "utf8");
export function loadPlanning() {
  const context = vm.createContext({ TextEncoder, URL, Intl });
  return vm.runInContext(planningSource + "\nKSpotPlanning;", context);
}
