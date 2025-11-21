import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Bike, ShoppingCart, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/crm', icon: Users, label: 'CRM Kanban' },
    { path: '/bikes', icon: Bike, label: 'Gestão de Bikes' },
    { path: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://xnujltaointazdntjasj.supabase.co/storage/v1/object/public/IMAGENS/ChatGPT%20Image%2019%20de%20nov.%20de%202025,%2016_15_04.png"
              alt="Ramon Bikes Elétricas"
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold text-foreground hidden sm:block">
              Gestão Ramon Bikes Elétricas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <RippleButton
              variant="ghost"
              onClick={toggleTheme}
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </RippleButton>
            <RippleButton
              variant="ghost"
              onClick={handleSignOut}
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </RippleButton>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  {isActive ? (
                    <RippleButton
                      variant="hover"
                      className="gap-2 whitespace-nowrap bg-primary text-primary-foreground"
                      hoverBaseColor="hsl(var(--primary))"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </RippleButton>
                  ) : (
                    <RippleButton
                      variant="ghost"
                      className="gap-2 whitespace-nowrap"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </RippleButton>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {children}
      </main>
    </div>
  );
}
