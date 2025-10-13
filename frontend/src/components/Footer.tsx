import { Link } from 'react-router-dom';
import { Activity, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Activity className="h-6 w-6 text-accent" />
              <span>RiskPulse</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time risk intelligence for electronic trading environments.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API Reference
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} RiskPulse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
