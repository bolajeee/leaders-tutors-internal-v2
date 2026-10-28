import Image from "next/image";
import { ReactNode } from "react";

type UserAuthWrapperProps = {
  children: ReactNode;
};

export const UserAuthWrapper = ({ children }: UserAuthWrapperProps) => {
  return (
    <main className="flex h-dvh w-full overflow-hidden">
      {/* LEFT SECTION */}
      <section className="hidden h-full w-full max-w-150 flex-shrink-0 flex-col items-start justify-between bg-[url('/body-pix/auth-bg.png')] bg-cover bg-center bg-no-repeat p-10 animate-fade-left md:flex">
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
      <section className="flex h-full min-h-0 w-full items-start justify-center overflow-y-auto bg-white px-5 py-10 md:max-w-[calc(100%-600px)]">
        <div className="my-auto w-full max-w-125 p-4">{children}</div>
      </section>
    </main>
  );
};
