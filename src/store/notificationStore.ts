import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationState {
  readIds: string[];
  markRead: (ids: string[]) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      readIds: [],
      markRead: (ids) =>
        set((state) => ({ readIds: Array.from(new Set([...state.readIds, ...ids])) })),
    }),
    { name: "lt-notifications" },
  ),
);
