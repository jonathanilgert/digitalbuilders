import { Container, Eyebrow } from "@/components/ui";

export const metadata = { title: "Admin Login — Digital Builders" };
export default function AdminLogin() {
  return <section className="min-h-screen pt-36 pb-20"><Container><form action="/api/admin/login" method="post" className="mx-auto max-w-md card p-8"><Eyebrow>Admin</Eyebrow><h1 className="mt-5 font-display text-3xl font-semibold text-fg">Digital Builders admin</h1><input name="token" type="password" required className="mt-6 w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg" placeholder="Admin token" /><button className="mt-5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink">Open admin</button></form></Container></section>;
}
