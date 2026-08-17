import Image from "next/image";

export default function RestaurantBrand() {
  return (
    <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24 bg-culinary-card border-r border-culinary-border relative overflow-hidden h-full">
      {/* Background Hero Image */}
      <div className="absolute inset-0 opacity-40 mix-blend-multiply">
        <Image 
          src="/images/restaurant-login.png" 
          alt="Restaurant background" 
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center"
          priority
        />
      </div>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-culinary-card/60 via-culinary-card/80 to-culinary-card z-0" />

      <div className="relative z-10 flex flex-col items-start max-w-lg">
        {/* Logo */}
        <div className="mb-10 w-24 h-24 relative rounded-full overflow-hidden border-2 border-culinary-primary/30 shadow-lg bg-white/50 backdrop-blur-sm p-2 flex items-center justify-center">
           <Image
            src="/images/logo.png"
            alt="The Culinary Ledger Logo"
            fill
            sizes="96px"
            className="object-contain p-2"
          />
        </div>

        <h1
          className="text-5xl xl:text-7xl font-cormorant text-culinary-text leading-tight mb-6 tracking-tight"
        >
          The Culinary Ledger
        </h1>

        <p className="mt-4 text-xl text-culinary-muted leading-relaxed max-w-md font-sans">
          Every Great Meal Begins With Great Management.
        </p>

        <div className="mt-12 h-[2px] w-24 bg-culinary-primary shadow-sm" />

        <p className="mt-8 text-sm font-medium tracking-widest uppercase text-culinary-muted/80 font-sans">
          Restaurant Management System
        </p>
      </div>
    </div>
  );
}
