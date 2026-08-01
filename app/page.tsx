"use client";

import { useState, useEffect } from "react";
import App from "../src/App";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <App />;
}
