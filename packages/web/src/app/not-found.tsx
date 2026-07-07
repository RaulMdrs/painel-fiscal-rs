import Link from "next/link";

/**
 * cod_ibge que não é município do RS (ou rota inexistente). Falha com dignidade,
 * como o resto do painel: diz o que houve e oferece o caminho de volta.
 */
export default function NaoEncontrado() {
  return (
    <main className="lauda">
      <div className="erro-card">
        <h1>Município não encontrado</h1>
        <p>
          O endereço não corresponde a um município do Rio Grande do Sul no cadastro do painel.
          Verifique o código do IBGE na URL ou volte e busque pelo nome.
        </p>
        <p>
          <Link href="/">Voltar ao início</Link>
        </p>
      </div>
    </main>
  );
}
