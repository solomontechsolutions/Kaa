import { SearchExperience } from "@/components/app/search-experience";
import { activeWards, amenityLabels } from "@/lib/data/catalogue";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Search" };

export default async function AppSearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const locale = await getLocale();

  const amenities = Object.entries(amenityLabels).map(([slug, labels]) => ({
    slug,
    label: locale === "sw" ? labels.sw : labels.en,
  }));

  return (
    <SearchExperience
      locale={locale}
      wards={activeWards()}
      amenities={amenities}
      initialQuery={q}
    />
  );
}
