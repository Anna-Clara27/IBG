import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = 'https://servicodados.ibge.gov.br/api/v1/localidades'

function EstadoCard({ estado, selecionado, onSelecionar }) {
  return (
    <button
      className={`estado-card ${selecionado ? 'selecionado' : ''}`}
      onClick={() => onSelecionar(estado)}
      type="button"
    >
      <span className="estado-sigla">{estado.sigla}</span>
      <span className="estado-nome">{estado.nome}</span>
      <span className="estado-regiao">{estado.regiao.nome}</span>
    </button>
  )
}

function App() {
  const [estados, setEstados] = useState([])
  const [estadoSelecionado, setEstadoSelecionado] = useState(null)
  const [municipios, setMunicipios] = useState([])
  const [buscaEstado, setBuscaEstado] = useState('')
  const [buscaMunicipio, setBuscaMunicipio] = useState('')
  const [regiao, setRegiao] = useState('Todas')
  const [ordem, setOrdem] = useState('az')
  const [carregandoEstados, setCarregandoEstados] = useState(true)
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false)
  const [erroEstados, setErroEstados] = useState('')
  const [erroMunicipios, setErroMunicipios] = useState('')

  useEffect(() => {
    async function buscarEstados() {
      try {
        setCarregandoEstados(true)
        setErroEstados('')
        const resposta = await fetch(`${API}/estados?orderBy=nome`)
        if (!resposta.ok) throw new Error('Não foi possível consultar os estados.')
        const dados = await resposta.json()
        setEstados(dados)
      } catch (erro) {
        setErroEstados(erro.message || 'Ocorreu um erro ao carregar os estados.')
      } finally {
        setCarregandoEstados(false)
      }
    }
    buscarEstados()
  }, [])

  async function selecionarEstado(estado) {
    setEstadoSelecionado(estado)
    setBuscaMunicipio('')
    try {
      setCarregandoMunicipios(true)
      setErroMunicipios('')
      setMunicipios([])
      const resposta = await fetch(`${API}/estados/${estado.id}/municipios?orderBy=nome`)
      if (!resposta.ok) throw new Error('Não foi possível consultar os municípios.')
      const dados = await resposta.json()
      setMunicipios(dados)
    } catch (erro) {
      setErroMunicipios(erro.message || 'Ocorreu um erro ao carregar os municípios.')
    } finally {
      setCarregandoMunicipios(false)
    }
  }

  const regioes = ['Todas', ...new Set(estados.map((estado) => estado.regiao.nome))]
  const estadosFiltrados = useMemo(() => {
    return estados
      .filter((estado) => regiao === 'Todas' || estado.regiao.nome === regiao)
      .filter((estado) => `${estado.nome} ${estado.sigla}`.toLowerCase().includes(buscaEstado.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [estados, buscaEstado, regiao])

  const municipiosFiltrados = useMemo(() => {
    return municipios
      .filter((municipio) => municipio.nome.toLowerCase().includes(buscaMunicipio.toLowerCase()))
      .sort((a, b) => ordem === 'az'
        ? a.nome.localeCompare(b.nome)
        : b.nome.localeCompare(a.nome))
  }, [municipios, buscaMunicipio, ordem])

  return (
    <main className="pagina">
      <header className="topo">
        <div className="marca"><span className="marca-icone">BR</span><span>Brasil em dados</span></div>
        <span className="fonte">Dados oficiais · IBGE</span>
      </header>

      <section className="apresentacao">
        <p className="sobretitulo">EXPLORADOR DE LOCALIDADES</p>
        <h1>Conheça os <span>estados brasileiros</span></h1>
        <p className="descricao">Explore as unidades federativas do Brasil e descubra os municípios de cada estado usando informações da API pública do IBGE.</p>
        <div className="resumo">
          <div><strong>{estados.length || '—'}</strong><span>Estados carregados</span></div>
          <div><strong>{estadoSelecionado ? municipios.length : '—'}</strong><span>Municípios no estado</span></div>
          <div><strong>5</strong><span>Regiões brasileiras</span></div>
        </div>
      </section>

      <section className="conteudo">
        <div className="cabecalho-secao">
          <div><p className="sobretitulo">01 / UNIDADES FEDERATIVAS</p><h2>Selecione um estado</h2></div>
          <span className="contador">{estadosFiltrados.length} resultado(s)</span>
        </div>

        <div className="filtros estados-filtros">
          <label className="campo-busca"><span>⌕</span><input value={buscaEstado} onChange={(evento) => setBuscaEstado(evento.target.value)} placeholder="Buscar estado ou sigla..." /></label>
          <select value={regiao} onChange={(evento) => setRegiao(evento.target.value)} aria-label="Filtrar por região">
            {regioes.map((nome) => <option key={nome} value={nome}>{nome === 'Todas' ? 'Todas as regiões' : nome}</option>)}
          </select>
        </div>

        {carregandoEstados && <p className="mensagem">Carregando estados brasileiros...</p>}
        {erroEstados && <div className="erro">{erroEstados} Verifique sua conexão e atualize a página.</div>}
        {!carregandoEstados && !erroEstados && estadosFiltrados.length === 0 && <p className="mensagem">Nenhum estado encontrado para essa busca.</p>}
        {!carregandoEstados && !erroEstados && (
          <div className="grade-estados">
            {estadosFiltrados.map((estado) => (
              <EstadoCard key={estado.id} estado={estado} selecionado={estadoSelecionado?.id === estado.id} onSelecionar={selecionarEstado} />
            ))}
          </div>
        )}
      </section>

      <section className="conteudo municipios-secao">
        <div className="cabecalho-secao">
          <div><p className="sobretitulo">02 / MUNICÍPIOS</p><h2>{estadoSelecionado ? estadoSelecionado.nome : 'Explore por estado'}</h2></div>
          {estadoSelecionado && <span className="sigla-destaque">{estadoSelecionado.sigla}</span>}
        </div>
        {!estadoSelecionado && <div className="estado-vazio"><span className="globo">◎</span><p>Escolha um estado acima para consultar a lista de municípios.</p></div>}
        {estadoSelecionado && (
          <>
            <div className="detalhes-estado">
              <div><span>Região</span><strong>{estadoSelecionado.regiao.nome}</strong></div>
              <div><span>Código IBGE</span><strong>{estadoSelecionado.id}</strong></div>
              <div><span>Municípios</span><strong>{carregandoMunicipios ? '...' : municipios.length}</strong></div>
            </div>
            <div className="filtros municipios-filtros">
              <label className="campo-busca"><span>⌕</span><input value={buscaMunicipio} onChange={(evento) => setBuscaMunicipio(evento.target.value)} placeholder="Buscar município..." /></label>
              <select value={ordem} onChange={(evento) => setOrdem(evento.target.value)} aria-label="Ordenar municípios">
                <option value="az">Ordem: A a Z</option>
                <option value="za">Ordem: Z a A</option>
              </select>
            </div>
            {carregandoMunicipios && <p className="mensagem">Buscando municípios de {estadoSelecionado.nome}...</p>}
            {erroMunicipios && <div className="erro">{erroMunicipios} Tente selecionar o estado novamente.</div>}
            {!carregandoMunicipios && !erroMunicipios && municipiosFiltrados.length === 0 && <p className="mensagem">Nenhum município encontrado.</p>}
            {!carregandoMunicipios && !erroMunicipios && municipiosFiltrados.length > 0 && (
              <div className="lista-municipios">
                {municipiosFiltrados.map((municipio, indice) => (
                  <div className="municipio" key={municipio.id}><span className="numero">{String(indice + 1).padStart(2, '0')}</span><span>{municipio.nome}</span><span className="seta">↗</span></div>
                ))}
              </div>
            )}
            <p className="rodape-lista">Exibindo {municipiosFiltrados.length} de {municipios.length} municípios.</p>
          </>
        )}
      </section>

      <footer><span>BRASIL EM DADOS</span><span>Fonte: API de Localidades do IBGE</span><a href="https://servicodados.ibge.gov.br/api/v1/localidades/" target="_blank" rel="noreferrer">Documentação da API ↗</a></footer>
    </main>
  )
}

export default App
