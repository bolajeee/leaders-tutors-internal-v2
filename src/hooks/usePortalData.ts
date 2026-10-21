import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { fetchUserSubscription } from "@/services/portal";
import { fetchUserTransactions } from "@/services/payment";
import { getCurriculumRepository } from "@/services/curriculum";
import { resolveAccess } from "@/services/access";

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
