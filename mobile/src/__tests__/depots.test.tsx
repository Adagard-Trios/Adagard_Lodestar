// The depot registry on the phone (model/depots): names from OData Depots, the code until it loads, never a
// made-up name; cached on the device like the run.
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { depotName, useDepots } from '@/model/depots';
import { depotsLabel } from '@/model/plan';
import { client, DEPOTS, routes, signInAs } from './fake-platform';

jest.mock('@/model/platform', () => require('./fake-platform'));

function Names({ codes }: { codes: string[] }) {
  const { name, short } = useDepots();
  return <>{codes.map(c => <Text key={c} testID={`n-${c}`}>{`${name(c)}|${short(c)}`}</Text>)}</>;
}

beforeEach(() => {
  routes.clear();
  jest.clearAllMocks();
});

describe('useDepots()', () => {
  it('names depots from the registry; a code it does not know stays a code', async () => {
    await signInAs({ sub: 'u-dep1', realm_access: { roles: ['loader'] }, depot: ['KANDY'] });
    await render(<Names codes={['KANDY', 'GALLE']} />);
    await waitFor(() => expect(screen.getByTestId('n-KANDY').props.children).toBe('Kandy Hub|Kandy'));
    expect(screen.getByTestId('n-GALLE').props.children).toBe('GALLE|GALLE');
    expect(client.all).toHaveBeenCalledWith('Depots', { orderby: 'name' });
    // outside React (notice texts) the cached registry answers too
    expect(depotName('PELIYAGODA')).toBe('Peliyagoda DC');
    expect(depotsLabel(['KANDY'])).toBe('Kandy Hub');
    expect(depotsLabel(['KANDY', 'PELIYAGODA'])).toBe('both depots');
  });

  it('lists a depot registered later (GALLE) by its name', async () => {
    routes.set('Depots', [...DEPOTS, { code: 'GALLE', name: 'Galle DC', district: 'Galle', isActive: true }]);
    await signInAs({ sub: 'u-dep2', realm_access: { roles: ['loader'] }, depot: ['GALLE'] });
    await render(<Names codes={['GALLE']} />);
    await waitFor(() => expect(screen.getByTestId('n-GALLE').props.children).toBe('Galle DC|Galle'));
  });
});
