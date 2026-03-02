import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        online ? 'bg-green-500' : 'bg-red-500'
      }`}
    />
  );
}

export default async function ServerStatusPage() {
  const t = await getTranslations('serverStatus');

  const services = [
    { label: t('apiStatus'), online: true },
    { label: t('dbStatus'), online: true },
    { label: t('fastapiStatus'), online: true },
  ];

  const comingSoonServices = [
    { label: t('rabbitMQ') },
    { label: t('workers') },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => (
          <Card key={svc.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {svc.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <StatusDot online={svc.online} />
              <span className="text-lg font-semibold">
                {svc.online ? t('online') : t('offline')}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-8">{t('title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comingSoonServices.map((svc) => (
          <Card key={svc.label} className="opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {svc.label}
                </CardTitle>
                <Badge variant="secondary">{t('comingSoon')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-lg font-semibold text-muted-foreground">--</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('lastChecked')}: {new Date().toLocaleString()}
      </p>
    </div>
  );
}
