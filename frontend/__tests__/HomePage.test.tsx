import { render, screen, within } from '@testing-library/react';
import Home from '@/app/page';
import { FACES, FLOWS } from '@/screens';

// Lets one test render the directory without demo flows; every other test sees the generated data.
let mockFlows: typeof FLOWS | undefined;
jest.mock('@/screens', () => {
  const actual = jest.requireActual('@/screens');
  return {
    __esModule: true,
    FACES: actual.FACES,
    get FLOWS() {
      return mockFlows ?? actual.FLOWS;
    },
  };
});

afterEach(() => {
  mockFlows = undefined;
});

describe('Home page · screen directory', () => {
  it('shows the product heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Waypoint Lodestar' })).toBeInTheDocument();
  });

  it('has the three desk faces', () => {
    expect(Object.keys(FACES).sort()).toEqual(['admin', 'plan', 'store']);
  });

  it.each(Object.entries(FACES))('lists every %s screen with its id and link', (_app, face) => {
    render(<Home />);
    const open = screen.getByRole('link', { name: new RegExp(`${face.title}.*Open`) });
    expect(open).toHaveAttribute('href', face.start);

    const section = open.closest('section') as HTMLElement;
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(face.screens.length);

    face.screens.forEach((s, i) => {
      const link = within(items[i]).getByRole('link');
      expect(link).toHaveAttribute('href', s.href);
      expect(link).toHaveTextContent(s.id);
      // the id prefix is shown once, in the mono column, not repeated in the name
      expect(link).toHaveTextContent(s.name.replace(/^\S+\s/, ''));
    });
  });

  it('links every screen to a route under its face', () => {
    for (const [app, face] of Object.entries(FACES)) {
      expect(face.start).toBe(`/${app}`);
      for (const s of face.screens) {
        expect(s.href).toMatch(new RegExp(`^/${app}/${s.id.toLowerCase()}-[a-z0-9-]+$`));
      }
    }
  });

  it('has no duplicate screen ids or links', () => {
    const all = Object.values(FACES).flatMap(f => f.screens);
    expect(new Set(all.map(s => s.id)).size).toBe(all.length);
    expect(new Set(all.map(s => s.href)).size).toBe(all.length);
  });

  it('shows a "Start:" chip for each demo flow', () => {
    render(<Home />);
    const chips = screen.queryAllByRole('link', { name: /^Start: / });
    expect(chips).toHaveLength(FLOWS.length);
    FLOWS.forEach((f, i) => {
      expect(chips[i]).toHaveTextContent(`Start: ${f.name}`);
      expect(chips[i]).toHaveAttribute('href', f.href);
    });
  });
});

describe('Home page · without demo flows', () => {
  it('omits the flow chips section but still lists the screens', () => {
    mockFlows = [];
    render(<Home />);
    expect(screen.queryByRole('link', { name: /^Start: / })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SM-26\s*Sign in/ })).toHaveAttribute('href', '/store/sm-26-sign-in');
  });
});
