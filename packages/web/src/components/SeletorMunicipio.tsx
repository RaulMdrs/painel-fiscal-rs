"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { filtrarMunicipios } from "../lib/buscaMunicipios";
import type { MunicipioComStatus } from "../lib/contratoApi";

/** Teto de opções renderizadas — 497 nós de DOM de uma vez seria desperdício. */
const MAX_VISIVEL = 50;

/**
 * Seletor de município por busca com autocomplete (Tarefa 1.3). Combobox ARIA
 * feito à mão (sem dependência de biblioteca): navegável por teclado, com foco
 * visível e `aria-activedescendant`. Municípios sem_dados aparecem atenuados e
 * marcados, mas continuam clicáveis — chegar ao painel "não publicou" da cidade
 * é justamente o valor cívico; esconder seria tirar a informação de quem procura.
 */
export function SeletorMunicipio({
  municipios,
  ano,
}: {
  municipios: readonly MunicipioComStatus[];
  ano: number;
}) {
  const router = useRouter();
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const idBase = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const resultados = filtrarMunicipios(municipios, consulta).slice(0, MAX_VISIVEL);
  const listaId = `${idBase}-lista`;
  const opcaoId = (indice: number) => `${idBase}-op-${indice}`;

  function escolher(municipio: MunicipioComStatus): void {
    setAberto(false);
    setConsulta("");
    setAtivo(-1);
    inputRef.current?.blur();
    router.push(`/municipio/${municipio.codIbge}`);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>): void {
    if (!aberto && (evento.key === "ArrowDown" || evento.key === "ArrowUp")) {
      setAberto(true);
      return;
    }
    switch (evento.key) {
      case "ArrowDown":
        evento.preventDefault();
        setAtivo((i) => Math.min(i + 1, resultados.length - 1));
        break;
      case "ArrowUp":
        evento.preventDefault();
        setAtivo((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        const alvo = resultados[ativo >= 0 ? ativo : 0];
        if (alvo !== undefined) {
          evento.preventDefault();
          escolher(alvo);
        }
        break;
      }
      case "Escape":
        setAberto(false);
        setAtivo(-1);
        break;
    }
  }

  const mostrarLista = aberto && resultados.length > 0;
  const mostrarVazio = aberto && consulta.trim() !== "" && resultados.length === 0;

  return (
    <div className="seletor">
      <label className="seletor-label" htmlFor={`${idBase}-input`}>
        Trocar de município
      </label>
      <input
        id={`${idBase}-input`}
        ref={inputRef}
        className="seletor-input"
        type="text"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={mostrarLista && ativo >= 0 ? opcaoId(ativo) : undefined}
        autoComplete="off"
        placeholder="Digite o nome — ex.: Cachoeira, Pelotas, Santa Maria…"
        value={consulta}
        onChange={(e) => {
          setConsulta(e.target.value);
          setAberto(true);
          setAtivo(-1);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
      />

      {mostrarLista && (
        <ul className="seletor-lista" role="listbox" id={listaId} aria-label="Municípios do RS">
          {resultados.map((municipio, indice) => {
            const semDados = municipio.status === "sem_dados";
            return (
              <li
                key={municipio.codIbge}
                id={opcaoId(indice)}
                role="option"
                aria-selected={indice === ativo}
                className={
                  "seletor-opcao" +
                  (indice === ativo ? " ativa" : "") +
                  (semDados ? " seletor-opcao--muda" : "")
                }
                // onMouseDown (não onClick) dispara antes do blur do input,
                // com preventDefault preservando o foco até a navegação.
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(municipio);
                }}
                onMouseEnter={() => setAtivo(indice)}
              >
                <span className="seletor-opcao-nome">{municipio.nome}</span>
                {semDados && (
                  <span className="seletor-opcao-marca">não publicou {ano}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {mostrarVazio && (
        <div className="seletor-vazio" role="status">
          Nenhum município do RS com esse nome.
        </div>
      )}
    </div>
  );
}
