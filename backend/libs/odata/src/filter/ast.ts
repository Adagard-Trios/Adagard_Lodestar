/** Abstract syntax tree for OData $filter expressions. */

export type ComparisonOp = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';

export type LiteralType = 'string' | 'number' | 'boolean' | 'null' | 'date' | 'datetime' | 'enum';

export interface LiteralNode {
  kind: 'literal';
  type: LiteralType;
  /** string for string/date/datetime/enum, number for number, boolean, null */
  value: string | number | boolean | null;
  /** Qualified enum type for Namespace.Type'VALUE' literals */
  enumType?: string;
}

/** A property path such as `status` or `outlet/depot`, or a lambda variable path `l/qty`. */
export interface MemberNode {
  kind: 'member';
  path: string[];
}

export interface CallNode {
  kind: 'call';
  name: string;
  args: FilterNode[];
}

export interface CompareNode {
  kind: 'compare';
  op: ComparisonOp;
  left: FilterNode;
  right: FilterNode;
}

export interface InNode {
  kind: 'in';
  left: FilterNode;
  values: LiteralNode[];
}

export interface LogicalNode {
  kind: 'and' | 'or';
  left: FilterNode;
  right: FilterNode;
}

export interface NotNode {
  kind: 'not';
  operand: FilterNode;
}

/** `lineItems/any(l: l/qty gt 5)` or `lineItems/all(...)`; `any()` has no predicate. */
export interface LambdaNode {
  kind: 'lambda';
  op: 'any' | 'all';
  path: string[];
  variable?: string;
  predicate?: FilterNode;
}

export type FilterNode = LiteralNode | MemberNode | CallNode | CompareNode | InNode | LogicalNode | NotNode | LambdaNode;

export const COMPARISON_OPS: ReadonlySet<string> = new Set(['eq', 'ne', 'gt', 'ge', 'lt', 'le']);
