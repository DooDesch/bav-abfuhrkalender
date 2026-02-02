import { getBaseUrl } from '@/lib/utils/seo';

interface JsonLdProps {
  type?: 'website' | 'location' | 'street';
  location?: string;
  street?: string;
}

/**
 * JSON-LD Structured Data Component for SEO
 * Provides rich snippets for search engines
 */
export default function JsonLd({ type = 'website', location, street }: JsonLdProps) {
  const baseUrl = getBaseUrl();

  // WebApplication Schema - describes the app itself
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Dein Abfuhrkalender',
    description:
      'Finde alle Müllabfuhr-Termine für deine Adresse im BAV-Gebiet (Bergischer Abfallwirtschaftsverband).',
    url: baseUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    author: {
      '@type': 'Person',
      name: 'DooDesch',
    },
  };

  // GovernmentService Schema - describes the waste collection service
  const governmentServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Müllabfuhr im Bergischen Abfallwirtschaftsverband',
    serviceType: 'Waste Collection',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Bergischer Abfallwirtschaftsverband (BAV)',
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Bergisches Land, Nordrhein-Westfalen',
      },
    },
    areaServed: [
      'Burscheid',
      'Engelskirchen',
      'Hückeswagen',
      'Kürten',
      'Leichlingen',
      'Lindlar',
      'Morsbach',
      'Nümbrecht',
      'Odenthal',
      'Overath',
      'Radevormwald',
      'Reichshof',
      'Wermelskirchen',
    ],
  };

  // BreadcrumbList Schema for location and street pages
  const getBreadcrumbSchema = () => {
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
    ];

    if (location) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: location,
        item: `${baseUrl}/${location.toLowerCase()}`,
      });
    }

    if (street && location) {
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: street,
        item: `${baseUrl}/${location.toLowerCase()}/${encodeURIComponent(street.toLowerCase())}`,
      });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  };

  // WebPage Schema for specific pages
  const getWebPageSchema = () => {
    if (type === 'street' && location && street) {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Abfuhrkalender ${street}, ${location}`,
        description: `Müllabfuhr-Termine für ${street} in ${location}. Restmüll, Gelber Sack, Papier, Bio, Glas.`,
        url: `${baseUrl}/${location.toLowerCase()}/${encodeURIComponent(street.toLowerCase())}`,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Dein Abfuhrkalender',
          url: baseUrl,
        },
      };
    }

    if (type === 'location' && location) {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Abfuhrkalender ${location}`,
        description: `Alle Müllabfuhr-Termine für ${location}. Wähle deine Straße für Restmüll, Gelber Sack, Papier, Bio und Glas.`,
        url: `${baseUrl}/${location.toLowerCase()}`,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Dein Abfuhrkalender',
          url: baseUrl,
        },
      };
    }

    return null;
  };

  const webPageSchema = getWebPageSchema();
  const breadcrumbSchema = type !== 'website' ? getBreadcrumbSchema() : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(governmentServiceSchema),
        }}
      />
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />
      )}
      {webPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageSchema),
          }}
        />
      )}
    </>
  );
}
