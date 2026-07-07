"use client";

/**
 * Falhe alto, com dignidade: quando a API não responde ou o dado não valida,
 * a tela diz exatamente o que houve. Nenhum número é exibido sem validação.
 */
export default function Erro({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="lauda">
      <div className="erro-card">
        <h1>Não foi possível carregar os dados fiscais</h1>
        <pre>{error.message}</pre>
        <p>
          Este painel não exibe número que não pôde ser validado contra a API local — um espaço em
          branco honesto é melhor que um dado suspeito.
        </p>
        <button type="button" onClick={() => reset()}>
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
