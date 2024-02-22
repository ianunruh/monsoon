import { useCallback, useEffect } from "react";
import { useNavigate } from "@remix-run/react";

// https://sergiodxa.com/articles/automatic-revalidation-in-remix
export function useRevalidate() {
  let navigate = useNavigate();
  return useCallback(
    function revalidate() {
      navigate(".", { replace: true });
    },
    [navigate],
  );
}

interface RevalidateOnInterval {
  enabled?: boolean;
  interval?: number;
}

export function useRevalidateOnInterval({
  enabled = false,
  interval = 3000,
}: RevalidateOnInterval) {
  let revalidate = useRevalidate();
  useEffect(
    function revalidateOnInterval() {
      if (!enabled) return;
      let intervalId = setInterval(revalidate, interval);
      return () => clearInterval(intervalId);
    },
    [revalidate],
  );
}
