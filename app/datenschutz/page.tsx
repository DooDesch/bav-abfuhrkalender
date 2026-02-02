import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Cookie, BarChart3, Database, Mail, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Informationen zum Datenschutz und zur Verarbeitung personenbezogener Daten auf Dein Abfuhrkalender.',
  robots: {
    index: true,
    follow: true,
  },
};

function Section({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
      </div>
      <div className="pl-13 space-y-3 text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen pt-20 pb-24 sm:pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="gap-2 -ml-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </Button>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Datenschutzerklärung
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Informationen zur Verarbeitung deiner Daten gemäß DSGVO
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Stand: Februar 2026
          </p>
        </header>

        {/* Content */}
        <div className="space-y-12">
          {/* Verantwortlicher */}
          <Section icon={Mail} title="1. Verantwortlicher">
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            </p>
            <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800/50 p-4 text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">DooDesch</p>
              <p className="mt-1">
                E-Mail:{' '}
                <a 
                  href="mailto:doodesch+datenschutz@gmail.com" 
                  className="text-primary hover:underline"
                >
                  doodesch+datenschutz@gmail.com
                </a>
              </p>
            </div>
            <p className="text-sm">
              <strong className="text-zinc-700 dark:text-zinc-300">Hinweis:</strong>{' '}
              Diese Website ist ein privates Open-Source-Projekt und wird nicht kommerziell betrieben.
            </p>
          </Section>

          {/* Datenerfassung */}
          <Section icon={Database} title="2. Welche Daten werden erfasst?">
            <p>
              Diese Website wurde mit dem Grundsatz der Datensparsamkeit entwickelt. 
              Wir erfassen nur die Daten, die für den Betrieb notwendig sind:
            </p>
            
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 pt-2">
              a) Automatisch erfasste Daten (Server-Logs)
            </h3>
            <p>
              Bei jedem Zugriff auf unsere Website werden automatisch technische Informationen erfasst:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>IP-Adresse (anonymisiert)</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Aufgerufene Seite</li>
              <li>Browser-Typ und -Version</li>
              <li>Betriebssystem</li>
            </ul>
            <p className="text-sm">
              Diese Daten werden nur zur Sicherstellung des Betriebs und zur Fehleranalyse verwendet 
              und nach 7 Tagen automatisch gelöscht.
            </p>

            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 pt-2">
              b) Von dir eingegebene Daten
            </h3>
            <p>
              Wenn du eine Adresse (Ort und Straße) eingibst, wird diese:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>An die API des Bergischen Abfallwirtschaftsverbands (BAV) übermittelt, um die Abfuhrtermine abzurufen</li>
              <li>Optional in deinem Browser gespeichert (localStorage), damit du nicht bei jedem Besuch neu eingeben musst</li>
            </ul>
            <p className="text-sm">
              <strong className="text-zinc-700 dark:text-zinc-300">Wichtig:</strong>{' '}
              Die Adressdaten werden ausschließlich lokal in deinem Browser gespeichert und nicht auf unseren Servern.
            </p>
          </Section>

          {/* Cookies & LocalStorage */}
          <Section icon={Cookie} title="3. Cookies und lokaler Speicher">
            <p>
              Diese Website verwendet <strong className="text-zinc-700 dark:text-zinc-300">keine klassischen Cookies</strong>.
              Stattdessen nutzen wir den lokalen Speicher (localStorage) deines Browsers:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">Speicher</th>
                    <th className="text-left py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">Zweck</th>
                    <th className="text-left py-2 font-medium text-zinc-900 dark:text-zinc-100">Kategorie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">bav-last-address</td>
                    <td className="py-2 pr-4">Speichert deine zuletzt gewählte Adresse</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <Shield className="h-3 w-3" />
                        Notwendig
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">bav-waste-collection-filter</td>
                    <td className="py-2 pr-4">Speichert deine Filtereinstellungen für den Kalender</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <Shield className="h-3 w-3" />
                        Notwendig
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">bav-cookie-consent</td>
                    <td className="py-2 pr-4">Speichert deine Cookie-Einstellungen</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <Shield className="h-3 w-3" />
                        Notwendig
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm">
              Du kannst diese Daten jederzeit löschen, indem du die Browserdaten löschst oder 
              den localStorage manuell in den Entwicklertools deines Browsers löschst.
            </p>
          </Section>

          {/* Analytics */}
          <Section icon={BarChart3} title="4. Analyse und Statistik">
            <p>
              Wenn du der Nutzung von Statistik-Cookies zustimmst, verwenden wir:
            </p>

            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 pt-2">
              Vercel Analytics & Speed Insights
            </h3>
            <p>
              Diese Dienste helfen uns zu verstehen, wie die Website genutzt wird und wo wir sie verbessern können.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Vercel Analytics:</strong>{' '}
                Erfasst anonymisierte Seitenaufrufe und Nutzungsdaten
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Vercel Speed Insights:</strong>{' '}
                Misst die Ladegeschwindigkeit und Performance der Website
              </li>
            </ul>
            <p className="text-sm">
              <strong className="text-zinc-700 dark:text-zinc-300">Datenschutzfreundlich:</strong>{' '}
              Vercel Analytics ist privacy-focused und erfasst keine persönlich identifizierbaren Informationen. 
              Es werden keine Cookies gesetzt, stattdessen werden anonymisierte Hashes verwendet.
            </p>
            <p className="text-sm">
              Mehr Informationen findest du in der{' '}
              <a 
                href="https://vercel.com/docs/analytics/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Datenschutzerklärung von Vercel Analytics
              </a>
              .
            </p>
            <p className="text-sm bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <strong className="text-green-700 dark:text-green-400">Opt-in:</strong>{' '}
              Diese Analysetools werden nur aktiviert, wenn du im Cookie-Banner aktiv zustimmst.
              Du kannst deine Einwilligung jederzeit widerrufen.
            </p>
          </Section>

          {/* Drittanbieter */}
          <Section icon={Database} title="5. Externe Dienste">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              BAV API (Bergischer Abfallwirtschaftsverband)
            </h3>
            <p>
              Um die Abfuhrtermine für deine Adresse anzuzeigen, werden Anfragen an die API des 
              Bergischen Abfallwirtschaftsverbands (BAV) gesendet. Dabei wird die von dir eingegebene 
              Adresse (Ort und Straße) übermittelt.
            </p>
            <p className="text-sm">
              Die Datenschutzbestimmungen des BAV findest du unter:{' '}
              <a 
                href="https://www.bavweb.de/datenschutz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.bavweb.de/datenschutz
              </a>
            </p>

            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 pt-4">
              Vercel (Hosting)
            </h3>
            <p>
              Diese Website wird auf Vercel gehostet. Bei jedem Seitenaufruf werden technische 
              Zugriffsdaten an die Server von Vercel übermittelt.
            </p>
            <p className="text-sm">
              Weitere Informationen:{' '}
              <a 
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Vercel Privacy Policy
              </a>
            </p>
          </Section>

          {/* Rechte */}
          <Section icon={Scale} title="6. Deine Rechte">
            <p>
              Nach der DSGVO hast du folgende Rechte bezüglich deiner personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Auskunftsrecht (Art. 15 DSGVO):</strong>{' '}
                Du kannst Auskunft über deine von uns verarbeiteten Daten verlangen.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Berichtigungsrecht (Art. 16 DSGVO):</strong>{' '}
                Du kannst die Berichtigung unrichtiger Daten verlangen.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Löschungsrecht (Art. 17 DSGVO):</strong>{' '}
                Du kannst die Löschung deiner Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong>{' '}
                Du kannst die Einschränkung der Verarbeitung deiner Daten verlangen.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Datenübertragbarkeit (Art. 20 DSGVO):</strong>{' '}
                Du kannst verlangen, deine Daten in einem maschinenlesbaren Format zu erhalten.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Widerspruchsrecht (Art. 21 DSGVO):</strong>{' '}
                Du kannst der Verarbeitung deiner Daten widersprechen.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong>{' '}
                Eine erteilte Einwilligung kannst du jederzeit widerrufen (z.B. über den Cookie-Banner).
              </li>
            </ul>
            <p className="text-sm">
              Bei Fragen oder zur Ausübung deiner Rechte kannst du dich jederzeit an uns wenden.
            </p>
          </Section>

          {/* Beschwerderecht */}
          <Section icon={Shield} title="7. Beschwerderecht">
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung 
              deiner personenbezogenen Daten zu beschweren.
            </p>
            <p className="text-sm">
              Eine Liste der Datenschutzbeauftragten sowie deren Kontaktdaten findest du unter:{' '}
              <a 
                href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.bfdi.bund.de
              </a>
            </p>
          </Section>

          {/* Änderungen */}
          <section className="space-y-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              8. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte 
              Rechtslagen oder Änderungen des Dienstes anzupassen. Die aktuelle Version findest 
              du immer auf dieser Seite.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Letzte Aktualisierung: Februar 2026
            </p>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}
