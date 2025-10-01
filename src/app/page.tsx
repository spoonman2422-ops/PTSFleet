import { LoginForm } from '@/components/login-form';
import { AppLogo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="items-center text-center">
            <AppLogo className="w-20 h-20 mb-2 text-primary" />
            <CardTitle className="text-3xl font-bold">PTSFleetSystem</CardTitle>
            <CardDescription>Professional Transport Solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
