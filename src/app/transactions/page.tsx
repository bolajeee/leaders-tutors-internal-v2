import type { Metadata } from "next";
import Transactions from "@/features/portal/transactions/Transactions";

export const metadata: Metadata = { title: "Transactions", description: "Review your Leaders Tutors payment and wallet activity." };
export default function Page() { return <Transactions/>; }
