import Image from "next/image";
import { Sparkles, Building2, UtensilsCrossed, BarChart3, ShieldCheck, Shield } from "lucide-react";

interface RestaurantBrandProps {
  readonly restaurantName?: string;
  readonly restaurantLogo?: string | null;
  readonly restaurantDescription?: string | null;
  readonly restaurantCover?: string | null;
}

export default function RestaurantBrand({
  restaurantName,
  restaurantLogo,
  restaurantDescription,
  restaurantCover,
}: Readonly<RestaurantBrandProps>) {
  const brandName = restaurantName?.trim() || "The Culinary Ledger";
  const logoSrc = restaurantLogo || "/images/logo.png";
  const coverSrc = restaurantCover || "/images/restaurant-login.png";

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-stone-950 via-neutral-900 to-amber-950 text-white relative overflow-hidden h-full border-r border-amber-500/10 select-none">
      {/* Ambient background image with luxury blend */}
      <div className="absolute inset-0 opacity-20 mix-blend-luminosity pointer-events-none">
        <Image
          src={coverSrc}
          alt={brandName}
          fill
          sizes="50vw"
          className="object-cover object-center scale-105 transition-transform duration-10000 hover:scale-100"
          priority
        />
      </div>

      {/* Decorative Warm Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-radial-at-t from-transparent via-stone-950/70 to-stone-950/95 pointer-events-none" />

      {/* Top Brand & Monogram Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 relative rounded-2xl overflow-hidden border border-amber-400/30 shadow-xl bg-black/40 backdrop-blur-md p-2 flex items-center justify-center">
            <Image
              src={logoSrc}
              alt={brandName}
              fill
              sizes="64px"
              className="object-contain p-1.5"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={13} />
              <span>Super Admin Command Portal</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold font-cormorant text-white tracking-tight leading-none mt-0.5">
              {brandName}
            </h1>
          </div>
        </div>
      </div>

      {/* Center Hero Content & Feature Highlights */}
      <div className="relative z-10 my-auto py-8 max-w-lg space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-medium backdrop-blur-xs">
            <Shield size={13} className="text-amber-400" />
            <span>Multi-Tenant Restaurant SaaS & Governance</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold font-cormorant text-white leading-[1.15] tracking-tight">
            Register, Manage & Scale Modern Restaurant Networks.
          </h2>

          <p className="text-stone-300 text-sm xl:text-base leading-relaxed font-sans font-normal">
            {restaurantDescription ||
              "Centralized super administration console to onboard dining establishments, configure dietary categories (Pure Veg, Non-Veg, Both), assign owner credentials, and oversee nationwide branch operations in real-time."}
          </p>
        </div>

        {/* 4 Feature Highlights Grid for Super Admin */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-amber-400/30 transition-all group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 transition-all shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Restaurant Onboarding</p>
                <p className="text-[11px] text-stone-400">Instant registration & FSSAI</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-amber-400/30 transition-all group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-all shrink-0">
                <UtensilsCrossed size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Dietary Engine</p>
                <p className="text-[11px] text-stone-400">Pure Veg, Non-Veg & Hybrid</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-amber-400/30 transition-all group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-all shrink-0">
                <BarChart3 size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Multi-Branch Analytics</p>
                <p className="text-[11px] text-stone-400">Global revenue & order stats</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-amber-400/30 transition-all group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30 transition-all shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Tenant Security</p>
                <p className="text-[11px] text-stone-400">Role-based access & isolation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live System Indicator */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="text-stone-300 font-semibold">Multi-Tenant Gateway Engine</span>
        </div>
        <span className="text-stone-400 font-mono text-[11px]">Super Admin v1.0.0 • Active</span>
      </div>
    </div>
  );
}

