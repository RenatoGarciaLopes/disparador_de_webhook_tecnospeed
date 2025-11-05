export interface ICedenteRepository {
  find(
    cnpj: string,
    token: string,
    softwareHouseId: number,
  ): Promise<{
    id: number;
    status: "ativo" | "inativo";
  } | null>;
}
