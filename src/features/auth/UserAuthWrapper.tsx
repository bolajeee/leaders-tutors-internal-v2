import Image from "next/image";
import { ReactNode } from "react";

type UserAuthWrapperProps = {
  children: ReactNode;
};

export const UserAuthWrapper = ({ children }: UserAuthWrapperProps) => {
  return (
    <main className="min-h-screen w-full flex overflow-x-hidden">
      {/* LEFT SECTION */}
      <section className="hidden min-h-screen w-full max-w-150 bg-[url('/body-pix/auth-bg.png')] bg-cover bg-center bg-no-repeat p-10 flex-col justify-between items-start animate-fade-left flex-shrink-0 md:flex">
        {/* logo */}
        <div className="w-20">
          <Image
            src="/body-pix/icon.png"
            alt="Vector"
            className="w-full h-auto"
            width={0}
            height={0}
            unoptimized
          />
        </div>

        {/* text */}
        <div className="flex flex-col gap-3 text-white">
          <h1 className="font-bold-custom text-2xl">
            Leaders Tutors -{" "}
            <span className="text-(--secondary-color)">
              Student Learning Portal
            </span>
          </h1>
          <p className="font-medium-custom text-[15px]">
            Follow your curriculum by subject, term, and week. Watch clear
            lessons, revisit notes, practise, and keep your learning organised.
          </p>
        </div>
      </section>
      <section className="flex min-h-screen w-full items-center justify-center bg-white px-5 py-10 md:max-w-[calc(100%-600px)]">
        <div className="w-full max-w-125 p-4">{children}</div>
      </section>
    </main>
  );
};
