import { ArrowRight, Camera, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { KaaMark } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ButtonLink } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Karibu" };

/**
 * What a new tenant meets first.
 *
 * The app opens here rather than on a feed of houses, because the first thing
 * Kaa needs is an account: identity is what makes a landlord willing to accept
 * a stranger, and it is what a membership attaches to. Search is still free
 * afterwards — this screen asks for an account, not for money.
 */
export default async function WelcomePage() {
  const { locale, t } = await getI18n();

  return (
    <div className="flex min-h-full flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex justify-end">
        <LanguageSwitcher current={locale} />
      </div>

      <div className="flex flex-1 flex-col justify-center py-8">
        <KaaMark className="size-16 text-kaa-500" gradient animated id="welcome" />

        <h1 className="mt-8 text-balance text-3xl font-semibold leading-[1.15] tracking-tight">
          {t("welcome.title")}
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-foreground-muted">{t("welcome.body")}</p>

        <ul className="mt-8 space-y-3.5">
          <Point icon={<MapPin />} text="GPS pin taken on site" />
          <Point icon={<Camera />} text="Photographs from the day of the visit" />
          <Point icon={<ShieldCheck />} text={t("welcome.verifiedByNida")} />
        </ul>
      </div>

      <div className="space-y-3">
        <ButtonLink href="/app/join" size="lg" className="w-full">
          {t("welcome.createAccount")}
          <ArrowRight />
        </ButtonLink>
        <Link
          href="/app/search"
          className="block w-full rounded-xl py-3 text-center text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          {t("welcome.haveAccount")}
        </Link>
      </div>
    </div>
  );
}

function Point({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-4">
        {icon}
      </span>
      <span className="text-sm text-foreground-muted">{text}</span>
    </li>
  );
}
