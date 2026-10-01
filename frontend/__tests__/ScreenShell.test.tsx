import { act, fireEvent, render, screen } from '@testing-library/react';
import ScreenShell, { type ScreenNav } from '@/components/ScreenShell';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router }));

function setReferrer(value: string) {
  Object.defineProperty(document, 'referrer', { value, configurable: true });
}

function Design() {
  return (
    <div>
      <button data-lk="L1">Submit 2 orders</button>
      <div data-lk="N0"><span>Today</span></div>
      <a data-lk="B" href="#">Back</a>
      <span data-lk="X9">Not wired</span>
      <button data-lk="L5">Approve &amp; go live</button>
      <div data-lk="T1" role="tab">Plan tab</div>
      <p>Plain text</p>
    </div>
  );
}

const nav: ScreenNav = {
  links: {
    L1: { href: '/plan/dsp-01-cutoff-queue', kind: 'go' },
    N0: { href: '/plan/dsp-08-today-overview', kind: 'nav' },
    B: { href: '/plan/dsp-03-deferral-decision', kind: 'back' },
    L5: { app: 'Lodestar Dock', screen: 'LD-01 Dock queue', kind: 'go' },
    T1: { href: '/plan/dsp-02-plan-board', kind: 'nav' },
  },
};

function renderShell(n: ScreenNav = nav) {
  return render(
    <ScreenShell board="P2" nav={n}>
      <Design />
    </ScreenShell>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  setReferrer('');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ScreenShell · wrapper', () => {
  it('renders the design inside a board-scoped container', () => {
    const { container } = renderShell();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('b-P2', 'web-screen');
    expect(root).not.toHaveClass('is-tappable');
    expect(screen.getByText('Plain text')).toBeInTheDocument();
  });

  it('marks the whole screen tappable when nav.whole is set', () => {
    const { container } = renderShell({ links: {}, whole: { href: '/store/sm-05-sign-in' } });
    expect(container.firstElementChild).toHaveClass('is-tappable');
  });
});

describe('ScreenShell · navigation on data-lk click', () => {
  it('pushes the target of a "go" link', () => {
    renderShell();
    fireEvent.click(screen.getByText('Submit 2 orders'));
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-01-cutoff-queue');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces (no new history entry) for sidebar "nav" links', () => {
    renderShell();
    fireEvent.click(screen.getByText('Today'));
    expect(router.replace).toHaveBeenCalledWith('/plan/dsp-08-today-overview');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('resolves clicks on descendants to the closest data-lk ancestor', () => {
    renderShell();
    fireEvent.click(screen.getByText('Today')); // the <span> inside [data-lk=N0]
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('prevents the default action when a link is activated', () => {
    renderShell();
    const notCancelled = fireEvent.click(screen.getByText('Submit 2 orders'));
    expect(notCancelled).toBe(false);
  });

  it('ignores data-lk elements that have no entry in the nav table', () => {
    renderShell();
    const notCancelled = fireEvent.click(screen.getByText('Not wired'));
    expect(notCancelled).toBe(true);
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('ignores clicks outside any link when there is no whole-screen target', () => {
    renderShell();
    fireEvent.click(screen.getByText('Plain text'));
    expect(router.push).not.toHaveBeenCalled();
  });

  it('sends any click to nav.whole on tap-anywhere screens', () => {
    renderShell({ links: {}, whole: { href: '/store/sm-05-sign-in' } });
    fireEvent.click(screen.getByText('Plain text'));
    expect(router.push).toHaveBeenCalledWith('/store/sm-05-sign-in');
  });
});

describe('ScreenShell · keyboard access', () => {
  it('gives wired elements a button role and a tab stop, and leaves unwired ones alone', () => {
    renderShell();
    const wired = screen.getByText('Submit 2 orders');
    const div = screen.getByText('Today').parentElement as HTMLElement;
    expect(div).toHaveAttribute('role', 'button');
    expect(div.tabIndex).toBe(0);
    expect(wired).toHaveAttribute('tabindex', '0');
    const unwired = screen.getByText('Not wired');
    expect(unwired).not.toHaveAttribute('role');
    expect(unwired).not.toHaveAttribute('tabindex');
  });

  it('keeps an explicit role from the design', () => {
    renderShell();
    expect(screen.getByText('Plan tab')).toHaveAttribute('role', 'tab');
    expect(screen.getByText('Back')).toHaveAttribute('role', 'button');
  });

  it('activates a link with Enter', () => {
    renderShell();
    fireEvent.keyDown(screen.getByText('Submit 2 orders'), { key: 'Enter' });
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-01-cutoff-queue');
  });

  it('activates a link with Space', () => {
    renderShell();
    fireEvent.keyDown(screen.getByText('Today').parentElement as HTMLElement, { key: ' ' });
    expect(router.replace).toHaveBeenCalledWith('/plan/dsp-08-today-overview');
  });

  it('ignores other keys and keys pressed on non-link elements', () => {
    renderShell();
    fireEvent.keyDown(screen.getByText('Submit 2 orders'), { key: 'a' });
    fireEvent.keyDown(screen.getByText('Plain text'), { key: 'Enter' });
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('ScreenShell · back links', () => {
  it('goes back in history when the user came from another screen of this site', () => {
    window.history.pushState({}, '', '/plan/dsp-12-approve-and-go-live');
    setReferrer(`${window.location.origin}/plan/dsp-03-deferral-decision`);
    renderShell();
    fireEvent.click(screen.getByText('Back'));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('opens the parent screen when the page was opened directly (no same-site referrer)', () => {
    window.history.pushState({}, '', '/plan/dsp-12-approve-and-go-live');
    setReferrer('');
    renderShell();
    fireEvent.click(screen.getByText('Back'));
    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-03-deferral-decision');
  });

  it('does not go back to a foreign site', () => {
    window.history.pushState({}, '', '/plan/dsp-12-approve-and-go-live');
    setReferrer('https://evil.example.com/');
    renderShell();
    fireEvent.click(screen.getByText('Back'));
    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-03-deferral-decision');
  });
});

describe('ScreenShell · auto-advance', () => {
  const auto: ScreenNav = { links: nav.links, auto: { href: '/plan/dsp-02-plan-board' } };

  it('advances to nav.auto after 1.5 s', () => {
    jest.useFakeTimers();
    renderShell(auto);
    act(() => { jest.advanceTimersByTime(1499); });
    expect(router.push).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1); });
    expect(router.push).toHaveBeenCalledWith('/plan/dsp-02-plan-board');
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it('cancels the timer when the screen unmounts first', () => {
    jest.useFakeTimers();
    const { unmount } = renderShell(auto);
    act(() => { jest.advanceTimersByTime(1000); });
    unmount();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('does nothing on screens without nav.auto', () => {
    jest.useFakeTimers();
    renderShell();
    act(() => { jest.advanceTimersByTime(10_000); });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('shows the cross-device notice when auto-advancing to a phone screen', () => {
    jest.useFakeTimers();
    renderShell({ links: {}, auto: { app: 'Lodestar Run', screen: 'DR-12 Sync queue' } });
    act(() => { jest.advanceTimersByTime(1500); });
    expect(screen.getByRole('status')).toHaveTextContent('Continues in Lodestar Run on the phone: DR-12 Sync queue');
  });
});

describe('ScreenShell · cross-device toast', () => {
  it('shows a "Continues in" notice instead of navigating to a phone-only screen', () => {
    renderShell();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Approve & go live'));
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Continues in Lodestar Dock on the phone: LD-01 Dock queue');
    expect(toast.querySelector('b')).toHaveTextContent('Lodestar Dock');
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('hides itself after 4.5 s', () => {
    jest.useFakeTimers();
    renderShell();
    fireEvent.click(screen.getByText('Approve & go live'));
    act(() => { jest.advanceTimersByTime(4499); });
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(1); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('closes on OK without triggering a whole-screen tap', () => {
    renderShell({ links: nav.links, whole: { href: '/somewhere' } });
    fireEvent.click(screen.getByText('Approve & go live'));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});
