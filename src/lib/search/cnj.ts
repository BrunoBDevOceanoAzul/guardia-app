export type TribunalSummary = {
  tribunalCode: string;
  total: number;
  criminal: number;
  civil: number;
};

export function summarizeTribunalResults(results: TribunalSummary[]) {
  return {
    total: results.reduce((accumulator, item) => accumulator + item.total, 0),
    criminal: results.reduce(
      (accumulator, item) => accumulator + item.criminal,
      0,
    ),
    civil: results.reduce((accumulator, item) => accumulator + item.civil, 0),
    tribunals: results.map((item) => item.tribunalCode),
  };
}
