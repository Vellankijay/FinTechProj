import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Home from '@/routes/Home';
import Summary from '@/routes/Summary';
import Tech from '@/routes/Tech';
import Healthtech from '@/routes/Healthtech';
import Settings from '@/routes/Settings';
import RiskChat from '@/routes/RiskChat';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/tech" element={<Tech />} />
            <Route path="/healthtech" element={<Healthtech />} />
            <Route path="/risk-chat" element={<RiskChat />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
