import {
  Gauge,
  UserStar,
  TvMinimalPlay,
  CalendarSync,
  ReceiptText,
  Settings2,
  LogOut,
} from "lucide-react";

export const NAV_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
  },
  {
    name: "My Profile",
    href: "/settings#account",
    icon: UserStar,
  },
];

export const SIDEBAR_TOP_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
  },
  {
    name: "Tutorials",
    href: "/tutorials",
    icon: TvMinimalPlay,
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: CalendarSync,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ReceiptText,
  },
];

export const SIDEBAR_BOTTOM_LINKS = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings2,
  },
  {
    name: "Log-out",
    href: "#",
    icon: LogOut,
  },
];
