export interface ISoftwareHouseRepository {
  find(
    cnpj: string,
    token: string,
  ): Promise<{
    id: number;
    status: "ativo" | "inativo";
  } | null>;
}
