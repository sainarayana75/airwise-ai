import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from '../src/utils/useFocusTrap';
import { Navbar } from '../src/components/layout/Navbar';
import { AppProvider } from '../src/context/AppContext';

// Simple modal test component using useFocusTrap
const TestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const containerRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });
  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-dialog-title"
      tabIndex={-1}
      data-testid="test-dialog"
    >
      <h2 id="test-dialog-title">Test Accessible Dialog</h2>
      <input type="text" data-testid="input-first" placeholder="First input" />
      <button data-testid="btn-middle">Middle Button</button>
      <button data-testid="btn-last" onClick={onClose}>
        Close Modal
      </button>
    </div>
  );
};

const TestHost: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button data-testid="trigger-btn" onClick={() => setOpen(true)}>
        Open Modal
      </button>
      <TestModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

describe('Accessibility & WCAG 2.2 AA Compliance Tests', () => {
  it('automatically focuses the first focusable element when modal opens', async () => {
    const user = userEvent.setup();
    render(<TestHost />);

    const trigger = screen.getByTestId('trigger-btn');
    await user.click(trigger);

    const dialog = screen.getByTestId('test-dialog');
    expect(dialog).toBeInTheDocument();

    const firstInput = screen.getByTestId('input-first');
    expect(document.activeElement).toBe(firstInput);
  });

  it('closes dialog on Escape key and returns focus to trigger', async () => {
    const user = userEvent.setup();
    render(<TestHost />);

    const trigger = screen.getByTestId('trigger-btn');
    await user.click(trigger);
    expect(screen.getByTestId('test-dialog')).toBeInTheDocument();

    // Fire Escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByTestId('test-dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('traps focus inside the dialog when Tab is pressed on last element', async () => {
    const onClose = vi.fn();
    render(<TestModal isOpen={true} onClose={onClose} />);

    const firstInput = screen.getByTestId('input-first');
    const lastButton = screen.getByTestId('btn-last');

    // Focus last button
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);

    // Tab from last element should wrap to first element
    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    expect(document.activeElement).toBe(firstInput);
  });

  it('traps focus inside the dialog when Shift+Tab is pressed on first element', async () => {
    const onClose = vi.fn();
    render(<TestModal isOpen={true} onClose={onClose} />);

    const firstInput = screen.getByTestId('input-first');
    const lastButton = screen.getByTestId('btn-last');

    firstInput.focus();
    expect(document.activeElement).toBe(firstInput);

    // Shift + Tab from first element should wrap to last element
    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);
  });

  it('renders Navbar with accessible role="tablist" and role="tab" elements', () => {
    render(
      <AppProvider>
        <Navbar onOpenSettings={() => {}} />
      </AppProvider>
    );

    const tablist = screen.getByRole('tablist', { name: /main navigation/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(6);

    // Initial active tab (dashboard) should have aria-selected="true"
    const activeTab = tabs.find(t => t.getAttribute('aria-selected') === 'true');
    expect(activeTab).toBeDefined();
    expect(activeTab).toHaveTextContent(/dashboard/i);
  });
});
