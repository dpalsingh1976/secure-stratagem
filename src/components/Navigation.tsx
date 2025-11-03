import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, FileText, Calculator, Upload, Landmark, BookOpen, LogIn, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/#how-it-works', label: 'How It Works', isAnchor: true },
    { path: '/#solutions', label: 'Solutions', isAnchor: true },
  ];

  const calculatorItems = [
    { path: '/admin/risk-intake', label: 'DIME Life Insurance Calculator', icon: Calculator },
    { path: '/tax-bucket-estimator', label: '7702 Tax-Free Estimator', icon: Calculator },
    { path: '/stress-test', label: 'IUL vs 401k/IRA Comparison', icon: Calculator },
    { path: '/annuity-calculator', label: 'Annuity Income Calculator', icon: Calculator },
    { path: '/longevity-calculator', label: 'Longevity Risk Calculator', icon: Calculator },
    { path: '/inflation-stress-test', label: 'Inflation & Market Stress Test', icon: Calculator },
  ];

  const otherItems = [
    { path: '/iul-banking', label: 'IUL Banking', icon: Landmark },
    { path: '/about', label: 'About / Contact', icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container-financial">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="p-1 bg-gradient-primary rounded-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
               Guardian Shield
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}

            {/* Calculators Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium h-8 px-3">
                  Calculators
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                {calculatorItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="w-4 h-4 opacity-70" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Other Items */}
            {otherItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap relative ${
                  isActive(item.path)
                    ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Start Assessment Button */}
          <div className="hidden lg:block shrink-0">
            <Link to="/admin/risk-intake">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <FileText className="w-4 h-4" />
                Start Assessment
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 mt-8">
                {/* Start Assessment Button */}
                <Link to="/admin/risk-intake" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Start Assessment
                  </Button>
                </Link>

                <div className="border-t pt-4"></div>

                {navItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </a>
                ))}
                
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">CALCULATORS</p>
                  {calculatorItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t pt-4 mt-4">
                  {otherItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t pt-4 mt-4">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In / Register
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
