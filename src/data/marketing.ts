/**
 * Marketing copy lives here so it can be updated without touching page layout.
 * Facts (numbers, names, contact details) come from https://leaderstutors.com/.
 */
import { SUPPORT_CONTACT } from "@/lib/config";

export const siteName = "Leaders Tutors";

export const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Classes", href: "#classes" },
  { label: "Why Leaders Tutors", href: "#about" },
  { label: "Partners", href: "#partners" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
] as const;

export const hero = {
  eyebrow: "Online video classes",
  headline: "A good education is the foundation of everything you build.",
  highlight: "foundation",
  intro:
    "Leaders Tutors is an online learning platform that offers video-based classes, lesson notes and practice, organised by subject, term and week.",
  primaryCta: { label: "Start as a student", href: "/sign-up" },
  secondaryCta: { label: "Explore classes", href: "#classes" },
} as const;

export const stats = [
  { value: "56+", label: "Subjects available, with verified topics" },
  { value: "1,821+", label: "Digital classrooms and videos" },
  { value: "20+ hrs", label: "Average daily time users spend on the platform" },
  { value: "112,124", label: "Active students" },
] as const;

export const classPreviews = [
  { level: "Basic 1", subject: "Mathematics", tutor: "Paul Emmanuel" },
  { level: "Basic 2", subject: "Use of English", tutor: "Samson Ayorinde" },
  { level: "JSS 1", subject: "Biology", tutor: "Barry Job" },
  { level: "JSS 2", subject: "Business Studies", tutor: "Yakubu Ezekiel" },
  { level: "JSS 2", subject: "Mathematics", tutor: "Yakubu Ezekiel" },
] as const;

export const categories = [
  { name: "Basic", count: 3 },
  { name: "Junior", count: 6 },
  { name: "Science", count: 10 },
  { name: "Commercial", count: 2 },
  { name: "Art", count: 8 },
] as const;

export const howItWorks = [
  { step: "01", title: "Sign up", copy: "Create your student account and choose your class." },
  { step: "02", title: "Subscribe", copy: "Make a secure payment through Paystack to unlock your lessons." },
  { step: "03", title: "Get your tutorials", copy: "Follow your subjects by term and week, watch lessons and read notes." },
  { step: "04", title: "Earn", copy: "Collect points as you learn and build your personal development." },
] as const;

export const benefits = [
  { title: "Virtual classroom solution", copy: "Attend a full classroom of video lessons from your phone, tablet or computer." },
  { title: "Online remote learning", copy: "Learn from home or on the move, at the pace that suits you." },
  { title: "Revisit lessons any time", copy: "Replay a difficult topic as often as you need while your subscription is active." },
] as const;

export const testimonials = [
  { quote: "Leaders Tutors has made learning more flexible and helped me keep improving beyond the classroom.", name: "Barry Job", role: "JSS 3 student" },
  { quote: "I found a dependable after-school learning resource for my children, with lessons they can revisit at their own pace.", name: "Paul Emmanuel", role: "Parent" },
  { quote: "The platform exceeded my expectations and is proving useful for my future career.", name: "Afolabi Taiwo", role: "SS 2 student" },
  { quote: "The classes are engaging, clear and easy to return to whenever I need to revise a topic.", name: "Semako Samuel", role: "JSS 2 student" },
] as const;

export const partners = ["AfooTech", "MTN", "Orisun", "TVC"] as const;

export const faqs = [
  { question: "Who can use Leaders Tutors?", answer: "The platform supports primary, junior secondary and senior secondary learners with curriculum-based digital lessons." },
  { question: "How do I access lessons?", answer: "Create an account, verify your email and complete your subscription payment. Then open subjects by term and week from your student dashboard." },
  { question: "Can I learn on a mobile phone?", answer: "Yes. The website and student portal work on phones, tablets and desktop computers." },
  { question: "What happens when my subscription expires?", answer: "You can still sign in and browse your curriculum, but you need to renew before opening lesson videos, notes and practice." },
  { question: "How do I pay?", answer: "Payments are made securely through Paystack. You can also load your wallet from your dashboard." },
] as const;

export const contact = {
  address: "Suite 213, Block A, 2–4 Sura Shopping Complex, Lagos Island",
  phone: SUPPORT_CONTACT.phone,
  customerCare: SUPPORT_CONTACT.customerCare,
  email: SUPPORT_CONTACT.email,
} as const;

export const footer = {
  blurb: "Education meets innovation through accessible video learning for students across Nigeria.",
  copyright: "© 2023–2026 Leaders Tutors. Developed by AfooTECH IT Solution.",
} as const;

/** Digits only, for tel: links. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
