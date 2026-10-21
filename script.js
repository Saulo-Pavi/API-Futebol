// Base da API de Logs da Unoesc
const API_LOGS_BASE = "https://www.piway.com.br/unoesc/api";
const MATRICULA_ALUNO = "323930"; 

// Executado ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
    carregarListaPadraoSemFiltro();
});

let listaTimesGlobal = [];

// =========================================================================
// FUNCIONALIDADE 1: Gravar Log de Consumo
// =========================================================================
async function registrarLog(nomeApi, metodo, resultado) {
    const apiParam = encodeURIComponent(nomeApi);
    const metodoParam = encodeURIComponent(metodo);
    const resultadoParam = encodeURIComponent(resultado);

    const url = `${API_LOGS_BASE}/inserir/log/${MATRICULA_ALUNO}/${apiParam}/${metodoParam}/${resultadoParam}`;

    try {
        const resposta = await fetch(url);
        const texto = await resposta.text();
        console.log("Log registrado:", texto);
    } catch (erro) {
        console.error("Erro ao registrar log na API Piway:", erro);
    }
}

// =========================================================================
// MÉTODO 1 (SEM FILTRO): Consome a API pública com clubes
// =========================================================================
async function carregarListaPadraoSemFiltro() {
    const statusMsg = document.getElementById("statusMessage");
    const grid = document.getElementById("teamsGrid");
    
    statusMsg.innerText = "Consultando clubes das Ligas Inglesa e Espanhola em tempo real...";
    grid.innerHTML = "";

    const urlInglaterra = "https://raw.githubusercontent.com/openfootball/football.json/master/2020-21/en.1.json";
    const urlEspanha = "https://raw.githubusercontent.com/openfootball/football.json/master/2020-21/es.1.json";

    try {
        const [resInglaterra, resEspanha] = await Promise.all([
            fetch(urlInglaterra),
            fetch(urlEspanha)
        ]);

        if (!resInglaterra.ok || !resEspanha.ok) {
            throw new Error("Erro ao consultar os dados das ligas europeias.");
        }

        const dadosInglaterra = await resInglaterra.json();
        const dadosEspanha = await resEspanha.json();

        const timesMap = new Map();

        if (dadosInglaterra && dadosInglaterra.matches) {
            dadosInglaterra.matches.forEach(m => {
                const placar = m.score ? `${m.score.ft[0]} x ${m.score.ft[1]}` : "A definir";
                const infoConfronto = `${m.team1} ${placar} ${m.team2} (${m.date || 'Data N/I'})`;

                if (m.team1 && !timesMap.has(m.team1)) {
                    timesMap.set(m.team1, { nome: m.team1, pais: "Inglaterra", liga: "Premier League", ultimoJogo: infoConfronto });
                }
                if (m.team2 && !timesMap.has(m.team2)) {
                    timesMap.set(m.team2, { nome: m.team2, pais: "Inglaterra", liga: "Premier League", ultimoJogo: infoConfronto });
                }
            });
        }

        if (dadosEspanha && dadosEspanha.matches) {
            dadosEspanha.matches.forEach(m => {
                const placar = m.score ? `${m.score.ft[0]} x ${m.score.ft[1]}` : "A definir";
                const infoConfronto = `${m.team1} ${placar} ${m.team2} (${m.date || 'Data N/I'})`;

                if (m.team1 && !timesMap.has(m.team1)) {
                    timesMap.set(m.team1, { nome: m.team1, pais: "Espanha", liga: "La Liga", ultimoJogo: infoConfronto });
                }
                if (m.team2 && !timesMap.has(m.team2)) {
                    timesMap.set(m.team2, { nome: m.team2, pais: "Espanha", liga: "La Liga", ultimoJogo: infoConfronto });
                }
            });
        }

        const listaEquipes = Array.from(timesMap.values());

        listaTimesGlobal = listaEquipes.map((club, index) => ({
            idTeam: String(index + 100),
            strTeam: club.nome,
            strCountry: club.pais,
            strLeague: club.liga,
            ultimoJogo: club.ultimoJogo,
            strBadge: `https://via.placeholder.com/100/1e3a8a/ffffff?text=${encodeURIComponent(club.nome.substring(0,3).toUpperCase())}`,
            strStadium: `Estádio Oficial do ${club.nome}`,
            strStadiumCapacity: "55000",
            strStadiumLocation: club.pais,
            strDescriptionPT: `O ${club.nome} é um clube tradicional do futebol europeu que disputa a ${club.liga} na ${club.pais}.`
        }));

        statusMsg.innerText = "Exibindo clubes da Premier League e La Liga (Sem filtro):";
        exibirDadosComRepeticao(listaTimesGlobal);

        registrarLog("OpenFootball", "carregarListaPadraoSemFiltro", `Sucesso: ${listaTimesGlobal.length} clubes carregados`);

    } catch (erro) {
        console.error("Erro ao conectar com a API:", erro);
        statusMsg.innerText = "Erro ao carregar dados da API das ligas europeias.";
        
        registrarLog("OpenFootball", "carregarListaPadraoSemFiltro", "Erro ao carregar dados");
    }
}

// =========================================================================
// MÉTODO 2 (COM FILTRO): Pesquisa por nome no array
// =========================================================================
async function buscarTimesComFiltro() {
    const termo = document.getElementById("searchInput").value.trim().toLowerCase();
    const statusMsg = document.getElementById("statusMessage");

    if (!termo) {
        alert("Por favor, digite o nome de um time para filtrar (ex: Arsenal, Real Madrid, Chelsea, Barcelona).");
        return;
    }

    statusMsg.innerText = `Buscando por "${termo}"...`;

    const resultados = listaTimesGlobal.filter(t => 
        t.strTeam.toLowerCase().includes(termo)
    );

    if (resultados.length > 0) {
        statusMsg.innerText = `Resultados da API para "${termo}" (Com filtro):`;
        exibirDadosComRepeticao(resultados);
        
        registrarLog("OpenFootball", "buscarTimesComFiltro", `Busca '${termo}': ${resultados.length} resultados encontrados`);
    } else {
        statusMsg.innerText = `Nenhum clube encontrado com o nome "${termo}".`;
        document.getElementById("teamsGrid").innerHTML = "";

        registrarLog("OpenFootball", "buscarTimesComFiltro", `Busca '${termo}': Nenhum resultado retornado`);
    }
}

// =========================================================================
// FUNÇÃO UTILITÁRIA: Exibição COM repetição
// =========================================================================
function exibirDadosComRepeticao(listaTimes) {
    const grid = document.getElementById("teamsGrid");
    grid.innerHTML = "";

    listaTimes.forEach(team => {
        const card = document.createElement("div");
        card.classList.add("card");
        
        card.onclick = () => buscarDetalhesSemRepeticao(team.idTeam);

        card.innerHTML = `
            <img src="${team.strBadge}" alt="Escudo de ${team.strTeam}">
            <h3>${team.strTeam}</h3>
            <p><strong>País:</strong> ${team.strCountry}</p>
            <p><strong>Liga:</strong> ${team.strLeague}</p>
        `;

        grid.appendChild(card);
    });
}

// =========================================================================
// MÉTODO 3 (SEM REPETIÇÃO): Modal de detalhes
// =========================================================================
function buscarDetalhesSemRepeticao(idTime) {
    const modal = document.getElementById("detailModal");
    const modalBody = document.getElementById("modalBody");
    
    const t = listaTimesGlobal.find(item => item.idTeam === String(idTime));

    if (t) {
        modalBody.innerHTML = `
            <div class="team-detail-header">
                <img src="${t.strBadge}" alt="Escudo">
                <div>
                    <h2>${t.strTeam}</h2>
                    <p><strong>País:</strong> ${t.strCountry}</p>
                    <p><strong>Liga Atual:</strong> ${t.strLeague}</p>
                </div>
            </div>

            <p><strong>🏟️ Estádio:</strong> ${t.strStadium} (${Number(t.strStadiumCapacity).toLocaleString('pt-BR')} lugares)</p>
            <p><strong>📍 Localização:</strong> ${t.strStadiumLocation}</p>

            <div class="last-match-box">
                <p>⚽ Último Confronto Registrado na API:</p>
                <span>${t.ultimoJogo || 'Nenhum confronto registrado'}</span>
            </div>

            <h4 style="margin-top:15px;">Descrição do Clube:</h4>
            <div class="bio-text">
                ${t.strDescriptionPT}
            </div>
        `;
        modal.style.display = "flex";

        registrarLog("OpenFootball", "buscarDetalhesSemRepeticao", `Detalhes acessados: ${t.strTeam}`);
    } else {
        alert("Detalhes indisponíveis para este clube.");
    }
}

function fecharModal() {
    document.getElementById("detailModal").style.display = "none";
}

// =========================================================================
// FUNCIONALIDADE 2: Exibir Lista de Logs (Rota /logs/MATRICULA)
// =========================================================================
async function abrirModalLogs() {
    const modal = document.getElementById("logsModal");
    const tbody = document.getElementById("logsTableBody");
    const status = document.getElementById("logsStatus");

    modal.style.display = "flex";
    status.innerText = "Carregando histórico de logs...";
    tbody.innerHTML = "";

    try {
        const resposta = await fetch(`${API_LOGS_BASE}/logs/${MATRICULA_ALUNO}`);
        const logs = await resposta.json();

        if (logs.erro || logs.mensagem) {
            status.innerText = `Erro na API: ${logs.erro || logs.mensagem}`;
            return;
        }

        if (Array.isArray(logs) && logs.length > 0) {
            status.innerText = `Total de ${logs.length} log(s) registrado(s) para a matrícula ${MATRICULA_ALUNO}:`;
            
            logs.forEach(item => {
                const idLog = item.idlog || item.id;
                const apiNome = item.api || "OpenFootball";
                const metodo = item.metodo || item.log || "N/A";
                const resultado = item.resultado || item.descricao || "N/A";

                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${idLog}</td>
                    <td><strong>${apiNome}</strong> <br><small style="color:#64748b;">${metodo}</small></td>
                    <td>${resultado}</td>
                    <td class="center-text">
                        <button class="btn-danger" onclick="excluirLog('${idLog}')">🗑️ Excluir</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            status.innerText = `Nenhum log encontrado para a matrícula ${MATRICULA_ALUNO}.`;
        }
    } catch (erro) {
        console.error("Erro ao listar logs:", erro);
        status.innerText = "Erro ao conectar com a API de logs.";
    }
}

function fecharModalLogs() {
    document.getElementById("logsModal").style.display = "none";
}

// =========================================================================
// FUNCIONALIDADE 3: Excluir Log (Rota /excluir/log/IDLOG/aluno/MATRICULA)
// =========================================================================
async function excluirLog(idLog) {
    if (!confirm(`Confirmar a exclusão do log ID ${idLog}?`)) return;

    try {
        const resposta = await fetch(`${API_LOGS_BASE}/excluir/log/${idLog}/aluno/${MATRICULA_ALUNO}`);
        const texto = await resposta.text();
        
        alert(`Resposta: ${texto}`);
        abrirModalLogs();
    } catch (erro) {
        console.error("Erro ao excluir log:", erro);
        alert("Erro de conexão ao tentar excluir o log.");
    }
}