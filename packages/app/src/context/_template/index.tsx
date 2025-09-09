import React, { createContext, ReactNode, useContext } from "react";

import { useSlate } from "../../lib/slate";

import { BaseContextStateType, BaseContextType } from "./types";

export const BaseContextContext = createContext<BaseContextType | null>(null);

export function useBaseContext() {
  const context = useContext(BaseContextContext);
  if (!context) throw new Error("useBaseContext Missing Provider");
  return context;
}

export function BaseContextProvider({ children }: { children: ReactNode }) {
  const slate = useSlate<BaseContextStateType>({ status: "idle" });

  return (
    <BaseContextContext.Provider value={{ state: slate }}>
      {children}
    </BaseContextContext.Provider>
  );
}
