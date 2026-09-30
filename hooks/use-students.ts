"use client";

import { useEffect, useState } from "react";
import { subscribeStudents } from "@/services/student-service";
import type { AsyncState, Student } from "@/types/sieja";

export function useStudents(): AsyncState<Student[]> {
  const [state, setState] = useState<AsyncState<Student[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeStudents(
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState((current) => ({ ...current, loading: false, error })),
    );
    return unsubscribe;
  }, []);

  return state;
}
