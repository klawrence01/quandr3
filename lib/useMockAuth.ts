// lib/useMockAuth.ts
import { useState } from "react";

export function useMockAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  return { loggedIn, setLoggedIn };
}
