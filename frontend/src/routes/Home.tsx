import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, Activity, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function Home() {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Monitor your tech and healthtech investments in real-time. Get instant insights into portfolio risk, sector exposure, and market performance—all in one intelligent dashboard.';

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'Tech Portfolio Analytics',
      description:
        'Real-time monitoring of Cloud, AI/ML, Cybersecurity, and Enterprise Software investments with advanced VaR metrics.',
    },
    {
      icon: Shield,
      title: 'Healthtech Risk Management',
      description:
        'Track Medical Devices, Biotech, Digital Health, and Pharma Tech exposures with regulatory-aware risk scoring.',
    },
    {
      icon: Zap,
      title: 'Industry-Specific Insights',
      description: 'Tailored risk analytics for tech and healthtech sectors with custom volatility models and sentiment tracking.',
    },
    {
      icon: BarChart3,
      title: 'Multi-Sector Visibility',
      description:
        'Unified dashboard for tech and healthtech portfolios with cross-sector correlation analysis and exposure heatmaps.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-background via-accent/5 to-primary/10">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 backdrop-blur-sm border border-accent/20"
              >
                <Activity className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Smart Portfolio Risk Management</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
              >
                Your Smart{' '}
                <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                  Risk Tracker
                </span>
              </motion.h1>

              {/* Typewriter Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed min-h-[120px]"
              >
                {displayedText}
                <span className="animate-pulse">|</span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg" className="group bg-gradient-to-r from-accent to-primary hover:opacity-90">
                  <Link to="/summary">
                    Try RiskPulse Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="group backdrop-blur-sm">
                  <Link to="/settings">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap items-center gap-6 pt-4"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>No setup required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>Secure & private</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Risk Dashboard Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="glass-panel rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-accent/20">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Portfolio Overview</h3>
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      <span>Live</span>
                    </div>
                  </div>

                  {/* Risk Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20"
                    >
                      <div className="text-sm text-muted-foreground mb-1">Total Exposure</div>
                      <div className="text-2xl font-bold text-accent">$2.4M</div>
                      <div className="text-xs text-green-500 mt-1">↑ 12.5%</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                    >
                      <div className="text-sm text-muted-foreground mb-1">Risk Score</div>
                      <div className="text-2xl font-bold text-primary">68/100</div>
                      <div className="text-xs text-yellow-500 mt-1">Moderate</div>
                    </motion.div>
                  </div>

                  {/* Category Progress Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tech Portfolio</span>
                        <span className="text-accent">48%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '48%' }}
                          transition={{ duration: 1, delay: 1 }}
                          className="h-full bg-gradient-to-r from-accent to-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Healthtech Portfolio</span>
                        <span className="text-primary">52%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '52%' }}
                          transition={{ duration: 1, delay: 1.2 }}
                          className="h-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Floating Decorative Elements */}
                  <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-accent/20 blur-2xl animate-pulse" />
                  <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-primary/20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Specialized for Innovation Sectors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built for tech and healthtech investors. Track Cloud, AI, Medical Devices, Biotech, and more
              with sector-specific risk models and real-time analytics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-6 space-y-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-3xl p-12 md:p-16 text-center space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Ready to optimize your tech-healthtech portfolio?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore real-time analytics for your technology and healthcare innovation investments.
              Monitor sector exposures, track VaR metrics, and make data-driven decisions.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link to="/summary">Try Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/settings">View Settings</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
