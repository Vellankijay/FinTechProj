import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Live Risk Metrics',
      description:
        'Monitor VaR, P&L, and exposure in real-time with millisecond-level updates.',
    },
    {
      icon: Shield,
      title: 'Instant Breach Alerts',
      description:
        'Get notified immediately when limits are exceeded with severity-based prioritization.',
    },
    {
      icon: Zap,
      title: 'Scenario Analysis',
      description: 'Test "what-if" scenarios with interactive sliders before taking action.',
    },
    {
      icon: BarChart3,
      title: 'Visual Insights',
      description:
        'Interactive heatmaps, treemaps, and timelines for comprehensive risk visibility.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1]">
              See intraday risk
              <br />
              <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                as it happens
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Real-time monitoring for electronic trading. Catch breaches, analyze exposure, and
              act before risk becomes reality.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="group">
                <Link to="/summary">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/settings">Configure Settings</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
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
              Why real-time risk?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Traditional end-of-day risk reports miss the crucial moments. Monitor, analyze, and
              act on live data.
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
              Ready to monitor risk in real-time?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with our live dashboard or configure thresholds to match your trading
              strategy.
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
