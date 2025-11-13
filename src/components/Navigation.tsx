import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Menu, FileText, Calculator, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/#how-it-works", label: "How It Works" },
    { path: "/#solutions", label: "Solutions" },
    { path: "/#calculators", label: "Calculators" },
  ];

  const otherItems = [{ path: "/contact", label: "Contact", icon: User }];

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
              Prosperity Financial
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

            {/* Other Items */}
            {otherItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap relative ${
                  isActive(item.path)
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Start Assessment Button */}
          <div className="hidden lg:block shrink-0">
            <Link to="/admin/risk-intake">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
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
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
