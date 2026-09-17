import { ArrowLeft, ExternalLink, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG, isExternalUrl } from '@/lib/app-config';
import { openExternalUrl } from '@/lib/native-platform';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function PageShell({ title, eyebrow, children }) {
  return (
    <main className="min-h-screen bg-background pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header
        className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to profile">
            <Link to="/profile">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {eyebrow}
            </div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 text-sm leading-6 text-foreground">
        {children}
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <Card className="p-5 bg-card">
      <h2 className="font-bold text-foreground mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PageShell title="Privacy Policy" eyebrow="Your data">
      <p className="text-xs text-muted-foreground">Effective August 14, 2026</p>

      <Section title="Overview">
        <p>
          {APP_CONFIG.legalName} operates Boiler Transport, a campus transportation utility. This
          policy explains what the app processes, why it is needed, and the choices available to
          you.
        </p>
      </Section>

      <Section title="Information processed">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Favorites, permit selection, and in-app alert preferences that you save on your device.
          </li>
          <li>
            Your approximate or precise location only after permission, used on your device to find
            nearby parking.
          </li>
          <li>
            Standard network information and requested map tiles handled by the map provider when
            the map loads.
          </li>
        </ul>
        <p>
          Boiler Transport does not provide accounts, automatically collect email addresses or user
          IDs, run behavioral analytics, sell personal information, or use personal information for
          cross-app advertising.
        </p>
      </Section>

      <Section title="Location">
        <p>
          Location access is optional. Your coordinates are used on your device to calculate nearby
          parking and are not retained or sent to an application backend. Requested map tiles can
          reveal the general map area being viewed to the tile provider. You can revoke location
          access at any time in device settings.
        </p>
      </Section>

      <Section title="Service providers">
        <p>
          MapLibre GL JS renders the map in the app. The default map style and tiles are provided by
          OpenFreeMap, using map data from OpenStreetMap contributors. Those services receive the
          network information and tile requests needed to display the map. If you open directions,
          Apple Maps or Google Maps handles that request under its own privacy terms.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          Preferences remain in local storage on your device until you choose Remove Saved App Data,
          clear the app or browser storage, or uninstall the app. Boiler Transport does not maintain
          a remote account or server-side preference record for you.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          If you email support, we receive your email address and the information you choose to
          send.
        </p>
        {APP_CONFIG.supportEmail ? (
          <a
            className="break-all text-amber-800 dark:text-amber-300 font-semibold underline"
            href={`mailto:${APP_CONFIG.supportEmail}`}
          >
            {APP_CONFIG.supportEmail}
          </a>
        ) : (
          <p className="text-red-700 dark:text-red-300">
            A support contact must be configured before public release.
          </p>
        )}
      </Section>
    </PageShell>
  );
}

export function SupportPage() {
  const hasExternalSupport = isExternalUrl(APP_CONFIG.supportUrl);

  return (
    <PageShell title="Help & Support" eyebrow="We can help">
      <Section title="Contact support">
        <p>Include your app version, device model, and a short description of what happened.</p>
        {APP_CONFIG.supportEmail ? (
          <Button
            asChild
            className="w-full h-auto bg-gray-900 text-white mt-2 py-3 whitespace-normal"
          >
            <a href={`mailto:${APP_CONFIG.supportEmail}?subject=Boiler%20Transport%20Support`}>
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0 text-left">
                <span className="block">Email support</span>
                <span className="block break-all text-xs font-normal">
                  {APP_CONFIG.supportEmail}
                </span>
              </span>
            </a>
          </Button>
        ) : (
          <p className="text-red-700 dark:text-red-300 font-medium">
            Support email is not configured yet.
          </p>
        )}
        {hasExternalSupport && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void openExternalUrl(APP_CONFIG.supportUrl)}
          >
            Open support website <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        )}
      </Section>

      <Section title="Transportation information">
        <p>
          Availability, arrival, and event information can change quickly. Follow posted signs and
          instructions from transportation or public-safety personnel. Do not use the app while
          driving.
        </p>
      </Section>

      <Section title="Privacy and data controls">
        <p>
          Review how data is handled or return to Profile to remove the preferences saved on this
          device.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/privacy">
            <ShieldCheck className="w-4 h-4 mr-2" aria-hidden="true" />
            Privacy Policy
          </Link>
        </Button>
      </Section>
    </PageShell>
  );
}

export function AboutPage() {
  return (
    <PageShell title="About Boiler Transport" eyebrow={`Version ${APP_CONFIG.version}`}>
      <Section title="One transportation companion">
        <p>
          Boiler Transport brings parking guidance, bus information, event restrictions, favorites,
          alerts, and directions into one mobile experience.
        </p>
      </Section>

      <Section title="Data source">
        <p>
          Transportation information is provided by {APP_CONFIG.dataSourceName}. The bundled
          availability, bus, and event details are reference estimates, not a live campus feed.
          Always follow posted signs and official transportation or public-safety instructions.
        </p>
        {APP_CONFIG.dataSourceUrl && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void openExternalUrl(APP_CONFIG.dataSourceUrl)}
          >
            View source <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        )}
      </Section>

      <Section title="Map source">
        <p>
          Maps are rendered with MapLibre GL JS. The default style and tiles come from OpenFreeMap
          and use map data from OpenStreetMap contributors.
        </p>
      </Section>

      {!APP_CONFIG.universityAffiliated && (
        <Section title="Independent app">
          <p>
            Boiler Transport is an independent transportation companion and is not an official
            university app. University names and references are used only to describe the area
            served.
          </p>
        </Section>
      )}

      <p className="text-center text-xs text-muted-foreground">© 2026 {APP_CONFIG.legalName}</p>
    </PageShell>
  );
}
