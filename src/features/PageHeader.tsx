"use client";

import { ReactNode } from "react";
interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  addNavigation?: ReactNode;
}

export const PageHeader = ({
  icon,
  title,
  description,
  actions,
  className = "",
  addNavigation,
}: PageHeaderProps) => {
  return (
    <section
      className={`relative overflow-hidden bg-brand-gradient-soft border-b border-primary/10 ${className} animate-fade-down`}
    >
      {/* decorative brand blobs */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative px-4 py-5 md:px-8 md:py-7">
        {addNavigation}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Side - Title and Description */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                {icon}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="mb-1 text-2xl font-bold tracking-tight leading-tight text-brand-gradient">
                {title}
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-muted tracking-tight">
                {description}
              </p>
            </div>
          </div>

          {/* Right Side - Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  );
};
