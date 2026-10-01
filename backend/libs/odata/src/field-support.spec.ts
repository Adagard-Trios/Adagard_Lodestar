import { UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildEdmModel, DmmfDatamodel, isIgnoredModel } from './edm/model';
import { generateCsdl } from './edm/csdl';
import { ODataError } from './errors';
import { toODataError } from './odata-exception.filter';
import { testDatamodel } from '../test/fixtures';

describe('toODataError: precise codes for the field app', () => {
  it('keeps a code named by the exception (device posture)', () => {
    const err = toODataError(new UnauthorizedException({ statusCode: 401, code: 'DeviceMismatch', message: 'X-Device-Id does not match' }));
    expect(err.toJSON()).toEqual({ error: { code: 'DeviceMismatch', message: 'X-Device-Id does not match', target: null, details: [] } });
    expect(err.status).toBe(401);
  });

  it('falls back to the status code name for plain or odd codes', () => {
    expect(toODataError(new UnauthorizedException('Token expired')).code).toBe('Unauthorized');
    expect(toODataError(new UnauthorizedException({ code: 'bad code!', message: 'x' })).code).toBe('Unauthorized');
    expect(toODataError(new UnauthorizedException({ code: 42, message: 'x' })).code).toBe('Unauthorized');
  });

  it('has a 422 factory for semantic conflicts', () => {
    expect(ODataError.unprocessable('IdempotencyKeyReused', 'used', 'Idempotency-Key')).toMatchObject({ status: 422, code: 'IdempotencyKeyReused', target: 'Idempotency-Key' });
  });
});

describe('internal models (@odata.ignore)', () => {
  it('are left out of the EDM and $metadata', () => {
    const datamodel: DmmfDatamodel = {
      ...testDatamodel,
      models: [
        ...testDatamodel.models,
        {
          name: 'SecretKeys',
          documentation: '@odata.ignore internal table',
          primaryKey: null,
          fields: [{ name: 'id', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: true, hasDefaultValue: false }],
        },
      ],
    };
    const model = buildEdmModel(datamodel);
    expect(model.entityTypes.has('SecretKeys')).toBe(false);
    expect(model.entityTypes.has('Order')).toBe(true);
    expect(generateCsdl(model, { entitySets: [], operations: [] })).not.toContain('SecretKeys');
  });

  it('cover the per-service IdempotencyKey tables of the real schema', () => {
    const dmmf = Prisma.dmmf.datamodel as unknown as DmmfDatamodel;
    const ignored = dmmf.models.filter(isIgnoredModel).map((m) => m.name).sort();
    expect(ignored).toEqual(['OrdersIdempotencyKey', 'TripsIdempotencyKey']);
    const model = buildEdmModel(dmmf);
    expect(model.entityTypes.has('OrdersIdempotencyKey')).toBe(false);
    expect([...model.entityTypes.get('Order')!.properties.keys()]).toEqual(
      expect.arrayContaining(['unitsReceived', 'unitsExpected', 'receiptNote', 'receiptSavedAt', 'receivedAt', 'receivedBy', 'creditNoteId']),
    );
  });
});
