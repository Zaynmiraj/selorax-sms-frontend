"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare, Zap, Megaphone, CreditCard,
  ArrowRight, CheckCircle, Clock, Users, BarChart3, Shield,
  Send, Sparkles, Target, Bell, ChevronRight,
} from "lucide-react";
import { LogoIcon, LogoFull } from "@/components/Logo";

/* ─── Animated counter hook ─── */
function useCounter(target, duration = 2000) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { requestAnimationFrame(step); observer.disconnect(); }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return ref;
}

/* ─── Scroll reveal wrapper ─── */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
}

/* ─── Data ─── */
const FEATURES = [
  { icon: Zap, title: "Event Automations", desc: "Auto-send SMS on order confirmed, shipped, delivered, cancelled, refunded. Each event fully configurable.", size: "col-span-2", accent: "from-amber-500 to-orange-600" },
  { icon: Megaphone, title: "Bulk Campaigns", desc: "Send to thousands with audience targeting or manual lists.", size: "col-span-1", accent: "from-violet-500 to-purple-600" },
  { icon: Clock, title: "Schedule & Delay", desc: "Send later or delay automated messages by minutes.", size: "col-span-1", accent: "from-sky-500 to-blue-600" },
  { icon: Users, title: "Smart Audiences", desc: "Pull customers from your store or paste numbers. Deduplicate automatically.", size: "col-span-1", accent: "from-emerald-500 to-green-600" },
  { icon: BarChart3, title: "Live Analytics", desc: "Track delivery rates, campaign progress, and per-recipient status in real time.", size: "col-span-1", accent: "from-pink-500 to-rose-600" },
  { icon: Shield, title: "Auto-Renewal", desc: "Never run out. Set a threshold and your credits refill automatically.", size: "col-span-2", accent: "from-indigo-500 to-blue-700" },
];

const STEPS = [
  { num: "01", title: "Install the app", desc: "Add Messaging from the SeloraX App Store to your store in one click." },
  { num: "02", title: "Configure automations", desc: "Set up SMS templates for each order event. Choose instant or delayed delivery." },
  { num: "03", title: "Buy credits", desc: "Pick a package that fits. Volume discounts up to 25% off." },
  { num: "04", title: "Customers get notified", desc: "SMS sent automatically on every order update. Or launch a bulk campaign." },
];

const PACKAGES = [
  { name: "Starter", sms: 1000, price: 600, perSms: "0.60", color: "from-gray-800 to-gray-900" },
  { name: "Business", sms: 5000, price: 2500, perSms: "0.50", popular: true, color: "from-blue-600 to-indigo-700" },
  { name: "Enterprise", sms: 10000, price: 4500, perSms: "0.45", color: "from-gray-800 to-gray-900" },
];

function DashboardRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasStoreParam = searchParams.get("store_id") || searchParams.get("hmac");
    const isInIframe = typeof window !== "undefined" && window.self !== window.top;
    if (hasStoreParam || isInIframe) {
      const search = typeof window !== "undefined" ? window.location.search || "" : "";
      router.replace(`/dashboard${search}`);
    }
  }, [searchParams, router]);

  return null;
}

export default function LandingPage() {
  const c1 = useCounter(50000);
  const c2 = useCounter(98);
  const c3 = useCounter(1200);

  return (
    <div className="min-h-screen bg-[#06070a] text-white overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <Suspense fallback={null}><DashboardRedirect /></Suspense>
      {/* ── Animated gradient background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[70vw] h-[70vw] rounded-full opacity-15 blur-[120px] animate-pulse" style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", animationDuration: "8s" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] rounded-full opacity-10 blur-[100px] animate-pulse" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full opacity-8 blur-[80px] animate-pulse" style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)", animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <LogoFull size={32} light />
        <div className="flex items-center gap-3">
          <Link href="/billing" className="text-[13px] text-gray-400 hover:text-white transition-colors font-medium">Pricing</Link>
          <Link href="/dashboard" className="text-[13px] bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 font-medium transition-all">
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-28 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12px] font-medium text-gray-300 mb-7">
            <LogoIcon size={18} />
            Built for SeloraX e-commerce stores
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
            SMS that sells.<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Automated.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-9 font-light leading-relaxed">
            Notify customers on every order update, run marketing campaigns, and grow your store — all through SMS.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold text-[15px] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-[0.97]">
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="#features" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl font-semibold text-[15px] hover:bg-white/[0.1] transition-all">
              See Features
            </Link>
          </div>
        </Reveal>

        {/* Floating SMS previews */}
        <div className="relative mt-16 h-40 pointer-events-none">
          <div className="absolute left-[10%] top-0 animate-bounce" style={{ animationDuration: "4s" }}>
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/[0.1] rounded-2xl px-4 py-3 text-left max-w-[220px]">
              <p className="text-[11px] text-blue-300 font-semibold mb-0.5">Order Confirmed</p>
              <p className="text-[10px] text-gray-400 leading-snug">Hi Rahim, your order #1024 has been confirmed! Total: 1,250 BDT</p>
            </div>
          </div>
          <div className="absolute right-[8%] top-8 animate-bounce" style={{ animationDuration: "5s", animationDelay: "1s" }}>
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/[0.1] rounded-2xl px-4 py-3 text-left max-w-[200px]">
              <p className="text-[11px] text-emerald-300 font-semibold mb-0.5">Order Shipped</p>
              <p className="text-[10px] text-gray-400 leading-snug">Your order is on its way! Track: SFD-78291</p>
            </div>
          </div>
          <div className="absolute left-[35%] top-12 animate-bounce" style={{ animationDuration: "6s", animationDelay: "2s" }}>
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/[0.1] rounded-2xl px-4 py-3 text-left max-w-[180px]">
              <p className="text-[11px] text-violet-300 font-semibold mb-0.5">Campaign</p>
              <p className="text-[10px] text-gray-400 leading-snug">Flash sale! 30% off all items this weekend</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-3 gap-8 text-center">
          <Reveal>
            <p className="text-4xl md:text-5xl font-bold tracking-tight"><span ref={c1}>0</span>+</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">SMS Delivered</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-4xl md:text-5xl font-bold tracking-tight"><span ref={c2}>0</span>%</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Delivery Rate</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-4xl md:text-5xl font-bold tracking-tight"><span ref={c3}>0</span>+</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Active Stores</p>
          </Reveal>
        </div>
      </section>

      {/* ── Features bento grid ── */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <Reveal>
          <p className="text-sm text-blue-400 font-semibold tracking-widest uppercase mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
            Everything you need.<br />Nothing you don't.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const span = f.size === "col-span-2" ? "md:col-span-2" : "md:col-span-1";
            return (
              <Reveal key={f.title} delay={i * 0.08} className={span}>
                <div className="group h-full rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                  <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${f.accent} items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[15px] mb-1.5 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <Reveal>
          <p className="text-sm text-emerald-400 font-semibold tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
            Live in 5 minutes.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.1}>
              <div className="relative">
                <span className="text-6xl font-extrabold text-white/[0.04] absolute -top-4 -left-1">{s.num}</span>
                <div className="relative pt-8">
                  <h3 className="font-semibold text-[15px] mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-sm text-cyan-400 font-semibold tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Pay per SMS. No subscriptions.</h2>
            <p className="text-gray-500 max-w-md mx-auto">Buy credits once, use them anytime. Bulk discounts up to 25%. Credits never expire.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PACKAGES.map((pkg, i) => (
            <Reveal key={pkg.name} delay={i * 0.1}>
              <div className={`relative rounded-2xl p-[1px] ${pkg.popular ? "bg-gradient-to-b from-blue-500/50 to-indigo-500/50" : "bg-white/[0.08]"}`}>
                <div className="rounded-2xl bg-[#0c0d12] p-6 h-full">
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-[10px] font-bold rounded-full tracking-wide uppercase">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-4">{pkg.name}</h3>
                  <div className="mb-1">
                    <span className="text-4xl font-extrabold tracking-tight">{pkg.sms.toLocaleString()}</span>
                    <span className="text-sm text-gray-500 ml-1.5">SMS</span>
                  </div>
                  <p className="text-sm mb-6">
                    <span className={`font-bold ${pkg.popular ? "text-blue-400" : "text-white"}`}>{pkg.price.toLocaleString()} BDT</span>
                    <span className="text-gray-600 ml-1">/ {pkg.perSms} per SMS</span>
                  </p>

                  <div className="space-y-2.5 mb-6">
                    {["No expiry on credits", "Auto-renewal available", "Bangla & English SMS", "Real-time delivery logs"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-[13px] text-gray-400">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/billing"
                    className={`flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                      pkg.popular
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]"
                    }`}
                  >
                    Get Started
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <Reveal>
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-60" />
            <div className="relative px-8 md:px-16 py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to start messaging?</h2>
              <p className="text-blue-100 max-w-md mx-auto mb-8 font-light">
                Install the app, configure your automations, and send your first SMS in under 5 minutes.
              </p>
              <Link href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-[15px] shadow-xl hover:shadow-2xl transition-all active:scale-[0.97]">
                Open Dashboard
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <LogoFull size={24} light />
          <div className="flex items-center gap-6 text-[13px] text-gray-600">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/billing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/settings" className="hover:text-white transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
