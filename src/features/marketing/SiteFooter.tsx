import Image from "next/image";
import Link from "next/link";
import { categories, contact, footer, footerLinks, siteName, social, telHref } from "@/data/marketing";

export default function SiteFooter() {
  return (
    <footer className="bg-[#292b72]/95 px-5 py-14 text-slate-300 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Image src="/body-pix/logo.png" alt={siteName} width={154} height={54} className="h-11 w-auto rounded-lg bg-white px-2" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">{footer.blurb}</p>
        </div>
        <nav aria-label="Footer navigation">
          <h2 className="font-semibold text-white">Quick links</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-slate-300 hover:text-white">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-semibold text-white">Schools categories</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.name}>
                <Link href="/available-tutorials" className="text-slate-300 hover:text-white">
                  {category.name} <span className="text-slate-400">({category.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

          <div>
          <h2 className="font-semibold text-white">Student access</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/login" className="text-slate-300 hover:text-white">My account</Link></li>
            <li><Link href="/sign-up" className="text-slate-300 hover:text-white">Create account</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-white">Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-slate-300">
            <p>{contact.address}</p>
            <p><a className="hover:text-white" href={telHref(contact.phone)}>{contact.phone}</a></p>
            <p><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></p>
            <p><a className="hover:text-white" href={social.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp us</a></p>
          </address>
        </div>
      
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-slate-400">
        {footer.copyright}{" "}
        <a href={social.developer.href} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
          {social.developer.name}
        </a>
        .
      </p>
    </footer>
  );
}
