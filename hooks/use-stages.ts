"use client";

import { useEffect, useState } from "react";
import { DEFAULT_STAGE_ITEMS, subscribeStages } from "@/services/stage-service";
import type { AsyncState, StageItem } from "@/types/sieja";

export function useStages(): AsyncState<StageItem[]> {
  const [state, setState] = useState<AsyncState<StageItem[]>>({
    data: DEFAULT_STAGE_ITEMS,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeStages(
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((current) => ({ ...current, loading: false, error })),
    );
    return unsubscribe;
  }, []);

  return state;
}
