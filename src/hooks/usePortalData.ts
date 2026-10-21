import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { fetchUserSubscription } from "@/services/portal";
import { fetchUserTransactions } from "@/services/payment";
import { getCurriculumRepository } from "@/services/curriculum";
import { resolveAccess } from "@/services/access";
import type { AcademicTerm } from "@/types/curriculum";

const useIdentity = () => useAuthStore((state) => state.user?.email ?? state.token ?? "anonymous");

export const useSubscription = () => {
  const identity = useIdentity();
  const token = useAuthStore((state) => state.token);
  const query = useQuery({
    queryKey: ["subscription", identity],
    queryFn: fetchUserSubscription,
    enabled: Boolean(token),
  });
  return {
    ...query,
    subscription: query.data,
    access: resolveAccess({
      isLoading: query.isPending,
      isError: query.isError,
      subscription: query.data,
    }),
  };
};

export const useTransactions = () => {
  const identity = useIdentity();
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["transactions", identity],
    queryFn: fetchUserTransactions,
    enabled: Boolean(token),
  });
};

export const useCurriculum = () => {
  const identity = useIdentity();
  return useQuery({
    queryKey: ["curriculum", identity],
    queryFn: () => getCurriculumRepository().getSubjects(),
    retry: false,
  });
};

/**
 * A term's weeks. The live curriculum lists terms first and loads their weeks
 * only when one is opened; terms that already carry their weeks need no request.
 */
export const useTermWeeks = (subjectId: string, term: AcademicTerm, enabled: boolean) => {
  const identity = useIdentity();
  const needsWeeks = term.weeks.length === 0 && (term.lessonCount ?? 0) > 0;
  return useQuery({
    queryKey: ["weeks", identity, subjectId, term.id],
    queryFn: () => getCurriculumRepository().getWeeks(subjectId, term.id),
    enabled: enabled && needsWeeks,
    retry: false,
  });
};

export const useLesson = (lessonId: string) => {
  const identity = useIdentity();
  return useQuery({
    queryKey: ["lesson", identity, lessonId],
    queryFn: () => getCurriculumRepository().getLesson(lessonId),
    retry: false,
  });
};

/** Refresh anything that depends on payments or the subscription after a change. */
export const useRefreshAccount = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscription"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    ]);
};
