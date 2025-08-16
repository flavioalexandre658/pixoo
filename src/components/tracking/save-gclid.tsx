"use client";
import { useEffect } from "react";

import { setCookie } from "@/utils/functions.util";

const SaveGclid = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gclid = urlParams.get("gclid");

    if (gclid) {
      setCookie('gclid', gclid)
    }
  }, []);

  return null;
};

export default SaveGclid;
