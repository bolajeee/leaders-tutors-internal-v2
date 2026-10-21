import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { getInitials } from "@/utils/helpers";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/constants/portal/navlinks";
export const Header = () => {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const userName = user
    ? `${user.first_name} ${user.last_name}`.trim()
    : "Student User";

  return (
    <header className="bg-white/80 backdrop-blur-md z-20 w-full h-[60px] flex justify-between items-center gap-2 border-b border-primary/10 px-3 sm:px-5">
      <div className="flex items-center gap-3">
        <nav>
          <ul className="flex items-center gap-1 sm:gap-3 text-white">
            {NAV_LINKS.map((link) => (
              <Link href={link.href} key={link.name}>
                <li
                  className={`transition-colors duration-300 text-sm whitespace-nowrap flex items-center justify-start gap-1 cursor-pointer px-2 sm:px-4 py-2 rounded-full ${
                    pathname === link.href || (link.href.includes("#") && pathname === link.href.split("#")[0])
                      ? "bg-primary-light text-primary"
                      : "text-slate-600 hover:bg-primary-light/60 hover:text-primary"
                  }`}
                >
                  {link.icon && (
                    <link.icon
                      size={16}
                      className="inline-block mr-1 text-(--secondary-color)"
                    />
                  )}
                  <span className="sr-only lg:not-sr-only">{link.name}</span>
                </li>
              </Link>
            ))}
          </ul>
        </nav>
      </div>
      {/* //// user profile and settings, notification and FAQ icon */}
      <div className="flex items-center gap-2">
        <Link
          href="#"
          className="relative h-[40px] w-[40px] text-primary bg-primary-light/60 hover:bg-primary-light rounded-full flex items-center justify-center transition-colors"
        >
          <Bell size={20} />
        </Link>
        <div className="relative">
          {/* Trigger */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-primary-light/50 p-1 pr-2 rounded-full transition-colors"
            onClick={() => setOpen(!open)}
          >
            <div className="text-white font-medium-custom w-[40px] h-[40px] text-xs bg-brand-gradient shadow-glow rounded-full flex items-center justify-center">
              {getInitials(userName)}
            </div>
            <span className="hidden sm:inline text-sm text-black font-medium-custom">
              {userName}
            </span>
            <ChevronDown size={16} className="text-black" />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-primary/10 shadow-pop overflow-hidden animate-fadeIn z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
