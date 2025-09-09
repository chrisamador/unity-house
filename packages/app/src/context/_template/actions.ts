import { createActionsScripts } from "../../lib/action-scripts";

import { BaseContextType } from "./types";

type DepType = {
  state: BaseContextType["state"];
};

 
export function createBaseContextActions(deps: DepType) {
  return createActionsScripts({
    async bootstrap() {
      console.log("bootstrap");
    },
  });
}
