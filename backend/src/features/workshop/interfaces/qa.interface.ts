// interfaces/qa.interface.ts
export interface IQaService {
  create(data: { otId: number; checklist: string; resultado: string }): Promise<any>;
}
