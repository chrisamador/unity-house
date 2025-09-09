import React, { createContext, ReactNode, useContext, useEffect, useMemo } from "react";

import { useSlate } from "../../lib/slate";

import { ConvexReactClient } from "convex/react";
import { createAuthActions } from "./actions";
import { AuthStateType, AuthType } from "./types";

export const AuthContext = createContext<AuthType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth Missing Provider");
  return context;
}

export function AuthProvider({ children, convex }: { children: ReactNode, convex: ConvexReactClient }) {
  const slate = useSlate<AuthStateType>({ status: "idle" });

  const actions = useMemo(() => createAuthActions({ state: slate, convex }), [slate, convex]);

  useEffect(() => {
    // Bootstrap auth
    return actions.bootstrap();
  }, [slate, actions])


  return (
    <AuthContext.Provider value={{ state: slate, actions }}>
      {children}
    </AuthContext.Provider>
  );
}


