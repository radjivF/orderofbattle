import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { IndexBackdrop } from "./IndexBackdrop";
import { LandingMotion } from "./LandingMotion";
import { SiteFooter } from "./SiteFooter";

const buildFeatures = [
  {
    title: "Regiments",
    body: "Build your army by regiment. Heroes, units, reinforcements, points and formation rules as you go.",
  },
  {
    title: "Regiments of Renown",
    body: "Add a Regiment of Renown when the list allows it. Pick the package, keep the points honest.",
  },
] as const;

const playFeatures = [
  {
    title: "Wounds",
    body: "Track damage on every unit mid-game. Health, models, battle damage at a glance.",
  },
  {
    title: "Spells & prayers",
    body: "Mark which unit has the lasting buff. See it again in combat when it matters.",
  },
  {
    title: "Abilities by phase",
    body: "Hero, movement, shooting, charge, combat, end of turn. Only what that phase needs.",
  },
] as const;

export function TryLanding() {
  return (
    <LandingMotion>
      <IndexBackdrop veil="hero">
        <header className="relative z-20 mx-auto flex max-w-3xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:py-6">
          <Link href="/" className="flex min-h-11 items-center gap-2.5">
            <BrandMark size={36} className="h-8 w-auto drop-shadow-md" />
            <span className="sr-only">Order of Battle</span>
          </Link>
          <Link
            href="/app"
            className="min-h-11 rounded-xl border border-sigmarite/40 bg-ink/50 px-4 text-sm leading-[2.75rem] text-parchment/90 backdrop-blur-sm active:bg-ink/70 lg:hover:border-sigmarite/70 lg:hover:text-gold-bright"
          >
            My lists
          </Link>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16 sm:px-6">
          <section className="-mx-5 px-5 pt-2 pb-12 text-center sm:-mx-6 sm:px-6 sm:pt-6 sm:pb-16">
            <div data-rise="crest">
              <Image
                src="/brand/crest.webp"
                alt="Order of Battle crest: sword through O and B, gold laurels"
                width={512}
                height={436}
                sizes="(max-width: 640px) 152px, 224px"
                quality={82}
                priority
                className="mx-auto h-[9.5rem] w-auto drop-shadow-[0_0_40px_rgba(197,179,138,0.28)] sm:h-56"
              />
            </div>

            <div data-rise="copy" className="mt-5 sm:mt-7">
              <Image
                src="/brand/wordmark.webp"
                alt="Order of Battle"
                width={640}
                height={253}
                sizes="(max-width: 640px) 320px, 448px"
                quality={82}
                className="mx-auto h-auto w-[min(100%,20rem)] drop-shadow-md sm:w-[min(100%,28rem)]"
              />
              <p className="mt-5 text-[0.7rem] tracking-[0.38em] text-sigmarite uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.85)] sm:text-xs">
                Age of Sigmar · 4th edition
              </p>
              <h1 className="mx-auto mt-3 max-w-lg font-serif text-[1.65rem] leading-snug font-semibold text-parchment [text-shadow:0_2px_16px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] sm:mt-4 sm:text-4xl">
                Build the list. Play the battle.
              </h1>
            </div>

            <div
              className="gold-rule mx-auto mt-7 w-40 sm:mt-8 sm:w-56"
              aria-hidden="true"
            />

            <div data-rise="cta">
              <p className="mx-auto mt-7 max-w-md text-[0.95rem] leading-relaxed font-medium text-parchment [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] sm:mt-8 sm:text-lg">
                Unofficial army builder and table companion. Muster regiments,
                then switch to Play for wounds, magic, and phase abilities.
              </p>
              <div className="mt-8 sm:mt-10">
                <Link
                  href="/app"
                  className="gold-plate shine inline-flex min-h-12 items-center justify-center rounded-xl px-9 text-base font-semibold tracking-wide text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sigmarite lg:hover:-translate-y-0.5"
                >
                  Try Order of Battle
                </Link>
                <p className="mt-4 text-xs font-medium text-parchment/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                  Free · No account · Lists stay on your device
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="build-section" className="pt-2">
            <h2
              id="build-section"
              className="gold-text font-serif text-2xl font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] sm:text-3xl"
            >
              Build
            </h2>
            <p className="mt-2 max-w-lg text-sm font-medium text-parchment [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
              List construction from BSData catalogues.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
              {buildFeatures.map((feature) => (
                <li
                  key={feature.title}
                  data-rise="card"
                  className="gilded-card rounded-2xl p-5 sm:p-6"
                >
                  <h3 className="font-serif text-lg text-parchment sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-parchment/70">
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="play-section" className="mt-12 sm:mt-16">
            <p className="text-[0.7rem] tracking-[0.35em] text-sigmarite uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
              The part players love
            </p>
            <h2
              id="play-section"
              className="gold-text mt-2 font-serif text-2xl font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] sm:text-3xl"
            >
              Play mode
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed font-medium text-parchment [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] sm:text-base">
              Open a list, hit Play, and run the game from your phone. Track the
              fight without flipping warscrolls all night.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {playFeatures.map((feature) => (
                <li
                  key={feature.title}
                  data-rise="card"
                  className="gilded-card rounded-2xl p-5 sm:p-6"
                >
                  <h3 className="font-serif text-lg text-parchment sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-parchment/70">
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
            <div data-rise="card" className="mt-6 text-center sm:mt-8">
              <Link
                href="/app"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sigmarite/45 bg-ink/45 px-6 text-sm text-sigmarite backdrop-blur-sm active:bg-ink/60 lg:hover:border-sigmarite lg:hover:text-gold-bright"
              >
                Open My lists and try Play
              </Link>
            </div>
          </section>

          <section
            data-rise="card"
            aria-labelledby="about-order-of-battle"
            className="gilded-card mt-12 rounded-2xl p-5 sm:mt-16 sm:p-8"
          >
            <h2
              id="about-order-of-battle"
              className="gold-text font-serif text-xl sm:text-2xl"
            >
              About Order of Battle
            </h2>
            <div className="gold-rule mt-4 w-20" aria-hidden="true" />
            <p className="mt-5 text-sm leading-relaxed text-parchment/70">
              Build Age of Sigmar lists in the browser, then keep score at the
              table. Regiments, Regiments of Renown, wounds, magic targets, and
              phase abilities. Lists stay on your device.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-parchment/70">
              Catalogue data is BSData, not Games Workshop. Double-check points
              with your opponent or TO before you play.
            </p>
          </section>
        </main>

        <SiteFooter />
      </IndexBackdrop>
    </LandingMotion>
  );
}
