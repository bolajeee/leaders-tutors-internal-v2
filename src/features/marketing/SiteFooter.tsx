import Image from "next/image";
import Link from "next/link";
import { contact, footer, navLinks, siteName, telHref } from "@/data/marketing";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 px-5 py-14 text-slate-300 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Image src="/body-pix/logo.png" alt={siteName} width={154} height={54} className="h-11 w-auto rounded-lg bg-white px-2" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">{footer.blurb}</p>
        </div>
        <nav aria-label="Footer navigation">
          <h2 className="font-semibold text-white">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-slate-300 hover:text-white">{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-semibold text-white">Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-slate-300">
            <p>{contact.address}</p>
            <p><a className="hover:text-white" href={telHref(contact.phone)}>{contact.phone}</a></p>
            <p><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></p>
          </address>
        </div>
        <div>
          <h2 className="font-semibold text-white">Student access</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/login" className="text-slate-300 hover:text-white">Log in</Link></li>
            <li><Link href="/sign-up" className="text-slate-300 hover:text-white">Create account</Link></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-slate-400">{footer.copyright}</p>
    </footer>
  );
}
