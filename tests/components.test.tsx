import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../src/context/AppContext';
import { Navbar } from '../src/components/layout/Navbar';
import { Footer } from '../src/components/layout/Footer';

// Mock matchMedia for responsive UI tests in jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('UI Layout & Component Rendering', () => {
  it('renders Navbar with brand and navigation items', () => {
    render(
      <AppProvider>
        <Navbar onOpenSettings={() => {}} />
      </AppProvider>
    );

    expect(screen.getByText('Air')).toBeInTheDocument();
    expect(screen.getByText('Wise')).toBeInTheDocument();
    expect(screen.getByText('Air Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Daily Planner')).toBeInTheDocument();
    expect(screen.getByText('Indoor IAQ Advisor')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Living')).toBeInTheDocument();
    expect(screen.getByText('Impact Tracker')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('renders Footer with standards disclosure and open APIs', () => {
    render(<Footer />);

    expect(screen.getByText('AirWise AI')).toBeInTheDocument();
    expect(screen.getByText(/US EPA AQI Standard/i)).toBeInTheDocument();
    expect(screen.getByText(/Open-Meteo Air Quality/i)).toBeInTheDocument();
    expect(screen.getByText(/DEFRA & US EPA GHG Emission Factors/i)).toBeInTheDocument();
  });
});
