export interface DecimalValue {
  $numberDecimal?: string;
}

export type DecimalOrString = string | DecimalValue;

export const formatDecimal = (val?: DecimalOrString | number): string => {
  if (!val) return '0.00';
  if (typeof val === 'number') return val.toFixed(2);
  if (typeof val === 'string') return val;
  if (val.$numberDecimal) return val.$numberDecimal;
  return '0.00';
};
