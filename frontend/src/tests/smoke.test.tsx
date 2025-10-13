import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import Home from '../routes/Home';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </BrowserRouter>
);

describe('Smoke Tests', () => {
  it('renders Navbar without crashing', () => {
    render(<Navbar />, { wrapper: AllProviders });
    expect(screen.getByText(/RiskPulse/i)).toBeInTheDocument();
  });

  it('renders Footer without crashing', () => {
    render(<Footer />, { wrapper: AllProviders });
    expect(screen.getByText(/Real-time risk intelligence/i)).toBeInTheDocument();
  });

  it('renders Home page without crashing', () => {
    render(<Home />, { wrapper: AllProviders });
    expect(screen.getByText(/See intraday risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Dashboard/i)).toBeInTheDocument();
  });
});
