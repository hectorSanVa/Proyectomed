export interface Comision {
  id_miembro?: number;
  nombre: string;
  rol: "Presidente" | "Secretario Técnico" | "Representante Docente" | "Representante Estudiantil" | "Representante Administrativo";
  periodo_inicio?: Date;
  periodo_fin?: Date;
}
