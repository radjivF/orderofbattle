import Image from "next/image";
import Link from "next/link";
import { listFactions } from "@/engine/queries";
import { GEO_FAQS } from "@/lib/geoContent";
import { SITE_DESCRIPTION, SITE_GITHUB_URL } from "@/lib/site";
import { HOME_CTA_CLASS, HOME_CTA_QUIET_CLASS, SITE_HEADER_BAR_CLASS, SITE_HEADER_ROW_CLASS } from "@/lib/builderUi";
import { SiteBrandLockup } from "./BrandMark";
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
        <header className={`${SITE_HEADER_BAR_CLASS} relative z-20 pt-[env(safe-area-inset-top)]`}>
          <div className={`${SITE_HEADER_ROW_CLASS} lg:max-w-5xl`}>
            <SiteBrandLockup />
            <Link
              href="/dashboard"
              className={`${HOME_CTA_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sigmarite`}
            >
              Open lists
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
              >
                <path
                  d="M7.5 4.5 13 10l-5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16 sm:px-6 lg:max-w-5xl">
          <section className="relative -mx-5 overflow-hidden px-5 pt-0 pb-12 text-center sm:-mx-6 sm:px-6 sm:pt-6 sm:pb-16">
            {/* Local dark pool so crest/gold copy don't blend into the battle art */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bottom-8 -z-0 mx-auto max-w-2xl rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(5,5,5,0.82)_0%,rgba(5,5,5,0.55)_48%,transparent_72%)] sm:bottom-4"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div data-rise="crest">
                <Image
                  src="/brand/crest.webp"
                  alt="Order of Battle crest: sword through O and B, gold laurels"
                  width={512}
                  height={436}
                  sizes="(max-width: 640px) 152px, 224px"
                  quality={82}
                  priority
                  className="mx-auto h-[7.25rem] w-auto drop-shadow-[0_8px_28px_rgba(0,0,0,0.75)] sm:h-56"
                />
              </div>

              <div data-rise="copy" className="mt-3 sm:mt-7">
                <Image
                  src="/brand/wordmark.webp"
                  alt="Order of Battle"
                  width={640}
                  height={253}
                  sizes="(max-width: 640px) 320px, 448px"
                  quality={82}
                  priority
                  className="mx-auto h-auto w-[min(100%,18rem)] drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)] sm:w-[min(100%,28rem)]"
                />
                <h1 className="mx-auto mt-3 max-w-xl font-serif text-[1.5rem] leading-snug font-semibold text-parchment [text-shadow:0_2px_16px_rgba(0,0,0,0.95),0_1px_3px_rgba(0,0,0,1)] sm:mt-5 sm:text-4xl">
                  Free Age of Sigmar 4ed army builder
                </h1>
              </div>

              <div data-rise="cta" className="mt-5 sm:mt-8">
                <Link
                  href="/dashboard"
                  className={`${HOME_CTA_CLASS} min-h-12 px-9 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sigmarite`}
                >
                  Try Order of Battle
                </Link>
                <p className="mt-3 text-xs font-medium text-parchment [text-shadow:0_2px_10px_rgba(0,0,0,0.95)] sm:mt-4">
                  Free · No account · Lists stay on your device
                </p>
                <p className="mt-2 text-xs font-medium text-parchment/85 [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">
                  <a
                    href={SITE_GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
                  >
                    View source on GitHub
                  </a>
                </p>
              </div>

              <div
                className="gold-rule mx-auto mt-6 w-40 sm:mt-8 sm:w-56"
                aria-hidden="true"
              />

              <p className="mx-auto mt-5 max-w-lg text-[0.95rem] leading-relaxed font-medium text-parchment [text-shadow:0_2px_12px_rgba(0,0,0,0.95)] sm:mt-7 sm:text-lg">
                {SITE_DESCRIPTION}
              </p>
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
            <div
              data-rise="card"
              className="gilded-card rounded-2xl p-5 sm:p-8"
            >
              <p className="text-[0.7rem] tracking-[0.35em] text-sigmarite uppercase">
                The part players love
              </p>
              <h2
                id="play-section"
                className="gold-text mt-2 font-serif text-xl sm:text-2xl"
              >
                Play mode
              </h2>
              <div className="gold-rule mt-4 w-20" aria-hidden="true" />
              <p className="mt-5 text-sm leading-relaxed text-parchment/70 sm:text-base">
                Open a list, hit Play, and run the game from your phone. Track
                the fight without flipping warscrolls all night.
              </p>
            </div>
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
                href="/dashboard"
                className={HOME_CTA_QUIET_CLASS}
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
              with your opponent or TO before you play.{" "}
              <Link
                href="/guides/free-age-of-sigmar-army-builder"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                Free army builder
              </Link>
              {" · "}
              <Link
                href="/compare"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                Compare builders
              </Link>
              {" · "}
              <Link
                href="/play"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                Play mode
              </Link>
              {" · "}
              <Link
                href="/about"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                About
              </Link>
              {" · "}
              <a
                href={SITE_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                GitHub
              </a>
              .
            </p>
          </section>

          <section
            data-rise="card"
            aria-labelledby="factions-section"
            className="gilded-card mt-12 rounded-2xl p-5 sm:mt-16 sm:p-8"
          >
            <h2
              id="factions-section"
              className="gold-text font-serif text-xl sm:text-2xl"
            >
              Factions you can build
            </h2>
            <div className="gold-rule mt-4 w-20" aria-hidden="true" />
            <p className="mt-5 text-sm leading-relaxed text-parchment/70">
              4th edition catalogues in the app. Open a faction for counts, then
              create a list.
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {listFactions().map((faction) => (
                <li key={faction.id}>
                  <Link
                    href={`/factions/${faction.id}`}
                    className="inline-flex min-h-10 items-center text-sm font-medium text-parchment underline decoration-sigmarite/50 underline-offset-2 lg:hover:text-gold-bright"
                  >
                    {faction.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="faq-section"
            className="mt-12 sm:mt-16"
          >
            <h2
              id="faq-section"
              className="gold-text font-serif text-2xl font-semibold [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] sm:text-3xl"
            >
              Age of Sigmar army builder FAQ
            </h2>
            <dl className="mt-6 space-y-5">
              {GEO_FAQS.slice(0, 5).map((item) => (
                <div
                  key={item.question}
                  data-rise="card"
                  className="gilded-card rounded-2xl p-5 sm:p-6"
                >
                  <dt className="font-serif text-lg text-parchment">
                    {item.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-parchment/70">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-parchment/80">
              <Link
                href="/faq"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                All questions
              </Link>
              {" · "}
              <Link
                href="/guides/how-to-build-an-age-of-sigmar-army-list"
                className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
              >
                How to build a list
              </Link>
            </p>
          </section>
        </main>

        <SiteFooter />
      </IndexBackdrop>
    </LandingMotion>
  );
}
