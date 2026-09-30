"use client";

import { useEffect, useState } from "react";
import { subscribeQuestions } from "@/services/question-service";
import type { AsyncState, Question } from "@/types/sieja";

export function useQuestions(): AsyncState<Question[]> & { invalidCount: number } {
  const [state, setState] = useState<AsyncState<Question[]> & { invalidCount: number }>({
    data: [],
    loading: true,
    error: null,
    invalidCount: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribeQuestions(
      (data, invalidCount) => setState({ data, invalidCount, loading: false, error: null }),
      (error) => setState((current) => ({ ...current, loading: false, error })),
    );
    return unsubscribe;
  }, []);

  return state;
}
