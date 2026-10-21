"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Bell, BellOff, ChevronDown, LogOut, Settings2, UserRound } from "lucide-react";
import { getInitials } from "@/utils/helpers";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/constants/portal/navlinks";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useSubscription, useTransactions } from "@/hooks/usePortalData";
import { buildNotifications } from "@/services/notifications";
import { useNotificationStore } from "@/store/notificationStore";

/** Closes a popover on Escape and returns focus to its trigger. */
function useEscape(open: boolean, close: () => void, trigger: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, trigger]);
}

const toneStyles = {
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-indigo-50 text-[var(--primary-color)]",
} as const;

function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { subscription } = useSubscription();
  const { data: transactions } = useTransactions();
  const readIds = useNotificationStore((state) => state.readIds);
  const markRead = useNotificationStore((state) => state.markRead);

  const notifications = useMemo(
    () => buildNotifications(subscription, transactions),
    [subscription, transactions],
  );
  const unread = notifications.filter((item) => !readIds.includes(item.id));
  const close = () => setOpen(false);

  useClickOutside(wrapper as React.RefObject<HTMLDivElement>, close, open);
  useEscape(open, close, trigger);

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications"}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary-light/60 text-primary transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)]"
      >
        <Bell size={20} aria-hidden />
        {unread.length > 0 && (
          <span
            aria-hidden
            className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
          />
        )}
      </button>
      {open && (
        <div
          id="notification-panel"
          role="region"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={() => markRead(notifications.map((item) => item.id))}
                className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--primary-color)] hover:bg-indigo-50"
              >
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <BellOff className="h-7 w-7 text-slate-400" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-900">You&apos;re all caught up</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Subscription and payment updates will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href ?? "/dashboard"}
                    onClick={() => {
                      markRead([item.id]);
                      close();
                    }}
                    className="flex gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <span className={`mt-0.5 h-8 w-8 shrink-0 rounded-full p-2 ${toneStyles[item.tone]}`}>
                      <Bell className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">
                        {item.title}
                        {!readIds.includes(item.id) && <span className="sr-only">, unread</span>}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-600">{item.body}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useClickOutside(wrapper as React.RefObject<HTMLDivElement>, close, open);
  useEscape(open, close, trigger);

  const userName = user ? `${user.first_name} ${user.last_name}`.trim() : "Student";

  const handleLogout = () => {
    close();
    clearAuth();
    router.push("/login");
  };

  const itemClass =
    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50";

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-primary-light/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-color)]"
      >
        <span
          aria-hidden
          className="font-medium-custom flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-xs text-white shadow-glow"
        >
          {getInitials(userName)}
        </span>
        <span className="font-medium-custom hidden max-w-32 truncate text-sm text-slate-900 sm:inline">
          {userName}
        </span>
        <span className="sr-only sm:hidden">Account menu for {userName}</span>
        <ChevronDown size={16} className="text-slate-700" aria-hidden />
      </button>

      {open && (
        <div
          id="profile-menu"
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-pop"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
            <p className="truncate text-xs text-slate-600">{user?.email}</p>
          </div>
          <Link role="menuitem" href="/settings#account" onClick={close} className={itemClass}>
            <UserRound size={16} aria-hidden /> My profile
          </Link>
          <Link role="menuitem" href="/settings" onClick={close} className={itemClass}>
            <Settings2 size={16} aria-hidden /> Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={`${itemClass} border-t border-slate-100 text-red-700 hover:bg-red-50`}
          >
            <LogOut size={16} aria-hidden /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="z-20 flex h-[60px] w-full shrink-0 items-center justify-between gap-2 border-b border-primary/10 bg-white/90 px-3 backdrop-blur-md sm:px-5">
      <nav aria-label="Quick links">
        <ul className="flex items-center gap-1 sm:gap-3">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href.split("#")[0];
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-2 text-sm transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[var(--primary-color)] sm:px-4 ${
                    active
                      ? "bg-primary-light text-primary"
                      : "text-slate-700 hover:bg-primary-light/60 hover:text-primary"
                  }`}
                >
                  {link.icon && <link.icon size={16} aria-hidden className="mr-1 inline-block text-(--secondary-color)" />}
                  <span className="sr-only lg:not-sr-only">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center gap-2">
        <NotificationMenu />
        <ProfileMenu />
      </div>
    </header>
  );
};
