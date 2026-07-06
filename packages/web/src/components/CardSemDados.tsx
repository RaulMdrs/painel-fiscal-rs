import type { PainelMunicipio } from "../lib/contratoApi";

/**
 * Estado "sem dados" como informação cívica, não erro: o município é obrigado
 * por lei a publicar os relatórios, e a ausência merece ser dita com clareza.
 */
export function CardSemDados({ painel }: { painel: PainelMunicipio }) {
  return (
    <article className="card vizinho sem-dados">
      <h3 className="municipio-nome">{painel.municipio.nome}</h3>
      <p className="municipio-meta">
        {painel.municipio.uf} · IBGE {painel.municipio.codIbge}
      </p>
      <p className="sem-dados-titulo">Relatórios de {painel.ano} não publicados</p>
      <p>
        Não há RREO nem RGF de {painel.ano} de {painel.municipio.nome} no SICONFI até a última
        atualização deste painel — por isso nenhum indicador é exibido.
      </p>
      <p>
        A publicação desses relatórios é obrigação da Lei de Responsabilidade Fiscal (arts. 52 e
        54). A ausência é, em si, uma informação pública relevante.
      </p>
    </article>
  );
}
