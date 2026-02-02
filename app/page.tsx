import { redirect } from 'next/navigation';
import HomeWithoutParams from '@/components/HomeWithoutParams';
import { createStreetSlug } from '@/lib/utils/seo';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ location?: string | string[]; street?: string | string[] }>;
}) {
  const params = await searchParams;
  const locationParam =
    typeof params.location === 'string' ? params.location : params.location?.[0];
  const streetParam =
    typeof params.street === 'string' ? params.street : params.street?.[0];

  // Redirect old query-param URLs to SEO-friendly URLs (301 permanent redirect)
  if (locationParam?.trim() && streetParam?.trim()) {
    const locationSlug = locationParam.trim().toLowerCase();
    const streetSlug = createStreetSlug(streetParam.trim());
    redirect(`/${locationSlug}/${streetSlug}`);
  }

  // Show the home page with search form
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-16">
      <HomeWithoutParams />
    </main>
  );
}
