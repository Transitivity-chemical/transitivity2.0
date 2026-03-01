'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  credits: string;
  institution?: string;
  isInstitutional: boolean;
  createdAt: string;
}

interface UsageRecord {
  id: string;
  operation: string;
  tokensUsed: string;
  createdAt: string;
}

export function SettingsClient({
  user,
  usageRecords,
}: {
  user: User;
  usageRecords: UsageRecord[];
}) {
  const t = useTranslations('settings');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="billing">{t('billing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                {user.institution && (
                  <div>
                    <p className="text-xs text-muted-foreground">Institution</p>
                    <p className="font-medium">{user.institution}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('creditsRemaining')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {parseFloat(user.credits).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('currentPlan')}: Free Tier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
              </CardHeader>
              <CardContent>
                {usageRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No usage records yet.</p>
                ) : (
                  <div className="space-y-2">
                    {usageRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between border-b border-muted/50 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            {record.operation.replace(/_/g, ' ')}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(record.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-mono text-xs">
                          -{parseFloat(record.tokensUsed).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
