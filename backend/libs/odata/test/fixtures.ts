import { buildEdmModel, DmmfDatamodel } from '../src/edm/model';

/**
 * A small, hand-written DMMF datamodel for unit tests (independent of the
 * generated Prisma client): Order → Outlet (to-one), Order → OrderLineItem
 * (to-many), a composite-key type, a date-keyed type and a User with a secret.
 */
type FieldOpts = Partial<{
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  hasDefaultValue: boolean;
  isUpdatedAt: boolean;
  relationFromFields: string[];
}>;

const f = (name: string, kind: string, type: string, o: FieldOpts = {}) => ({
  name,
  kind,
  type,
  isList: o.isList ?? false,
  isRequired: o.isRequired ?? !o.isList,
  isId: o.isId ?? false,
  hasDefaultValue: o.hasDefaultValue ?? false,
  isUpdatedAt: o.isUpdatedAt ?? false,
  relationFromFields: o.relationFromFields ?? [],
});

export const testDatamodel: DmmfDatamodel = {
  enums: [
    { name: 'Depot', values: [{ name: 'PELIYAGODA' }, { name: 'KANDY' }] },
    { name: 'OrderStatus', values: ['RECEIVED', 'PLANNED', 'DELIVERED', 'DEFERRED', 'CANCELLED'].map((name) => ({ name })) },
    { name: 'TempClass', values: [{ name: 'CHILLED' }, { name: 'AMBIENT' }] },
  ],
  models: [
    {
      name: 'Order',
      primaryKey: null,
      fields: [
        f('id', 'scalar', 'String', { isId: true }),
        f('outletId', 'scalar', 'String'),
        f('outlet', 'object', 'Outlet', { relationFromFields: ['outletId'] }),
        f('runDate', 'scalar', 'DateTime'),
        f('status', 'enum', 'OrderStatus'),
        f('tempClass', 'enum', 'TempClass'),
        f('units', 'scalar', 'Int'),
        f('kg', 'scalar', 'Float'),
        f('notes', 'scalar', 'String', { isRequired: false }),
        f('deferredYesterday', 'scalar', 'Boolean'),
        f('meta', 'scalar', 'Json', { isRequired: false }),
        f('lineItems', 'object', 'OrderLineItem', { isList: true }),
        f('updatedAt', 'scalar', 'DateTime', { isUpdatedAt: true }),
      ],
    },
    {
      name: 'Outlet',
      primaryKey: null,
      fields: [
        f('id', 'scalar', 'String', { isId: true }),
        f('name', 'scalar', 'String'),
        f('depot', 'enum', 'Depot'),
        f('district', 'scalar', 'String'),
        f('accessNote', 'scalar', 'String', { isRequired: false }),
        f('orders', 'object', 'Order', { isList: true }),
      ],
    },
    {
      name: 'OrderLineItem',
      primaryKey: null,
      fields: [
        f('id', 'scalar', 'String', { isId: true }),
        f('orderId', 'scalar', 'String'),
        f('order', 'object', 'Order', { relationFromFields: ['orderId'] }),
        f('name', 'scalar', 'String'),
        f('qty', 'scalar', 'Int'),
        f('kg', 'scalar', 'Float'),
      ],
    },
    {
      name: 'ServiceAllowance',
      primaryKey: { fields: ['brand', 'dockType'] },
      fields: [f('brand', 'scalar', 'String'), f('dockType', 'scalar', 'String'), f('minutes', 'scalar', 'Int')],
    },
    {
      name: 'Calendar',
      primaryKey: null,
      fields: [f('date', 'scalar', 'DateTime', { isId: true }), f('isOperating', 'scalar', 'Boolean')],
    },
    {
      name: 'AuditEntry',
      primaryKey: null,
      fields: [f('seq', 'scalar', 'Int', { isId: true }), f('action', 'scalar', 'String'), f('roles', 'scalar', 'String', { isList: true })],
    },
    {
      name: 'User',
      primaryKey: null,
      fields: [
        f('id', 'scalar', 'String', { isId: true }),
        f('email', 'scalar', 'String'),
        f('passwordHash', 'scalar', 'String', { isRequired: false }),
      ],
    },
  ],
};

export const testModel = () => buildEdmModel(testDatamodel);
