// Executado ao carregar a página (MÉTODO 1: Consulta SEM Filtro)
window.addEventListener("DOMContentLoaded", () => {
    carregarListaPadraoSemFiltro();
});

// Variável em memória para armazenar o JSON vindo da requisição HTTP em tempo real
let listaTimesGlobal = [];

// =========================================================================
// MÉTODO 1 (SEM FILTRO): Consome a API pública com clubes da Inglaterra e Espanha
// =========================================================================
async function carregarListaPadraoSemFiltro() {
    const statusMsg = document.getElementById("statusMessage");
    const grid = document.getElementById("teamsGrid");
    
    statusMsg.innerText = "Consultando clubes e resultados das Ligas Inglesa e Espanhola...";
    grid.innerHTML = "";

    // API pública em tempo real contendo partidas e clubes da Premier League e La Liga
    const urlInglaterra = "https://raw.githubusercontent.com/openfootball/football.json/master/2020-21/en.1.json";
    const urlEspanha = "https://raw.githubusercontent.com/openfootball/football.json/master/2020-21/es.1.json";

    try {
        // Faz as duas requisições HTTP simultâneas
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

        // Processa os clubes e registra o último confronto da Premier League (Inglaterra)
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

        // Processa os clubes e registra o último confronto da La Liga (Espanha)
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

        // Estrutura os dados recebidos da API para os elementos da página
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
    } catch (erro) {
        console.error("Erro ao conectar com a API:", erro);
        statusMsg.innerText = "Erro ao carregar dados da API das ligas europeias.";
    }
}

// =========================================================================
// MÉTODO 2 (COM FILTRO): Pesquisa por nome no array retornado da API
// =========================================================================
async function buscarTimesComFiltro() {
    const termo = document.getElementById("searchInput").value.trim().toLowerCase();
    const statusMsg = document.getElementById("statusMessage");

    if (!termo) {
        alert("Por favor, digite o nome de um time para filtrar (ex: Arsenal, Real Madrid, Chelsea, Barcelona).");
        return;
    }

    statusMsg.innerText = `Buscando por "${termo}"...`;

    // Filtra os resultados obtidos da requisição HTTP
    const resultados = listaTimesGlobal.filter(t => 
        t.strTeam.toLowerCase().includes(termo)
    );

    if (resultados.length > 0) {
        statusMsg.innerText = `Resultados da API para "${termo}" (Com filtro):`;
        exibirDadosComRepeticao(resultados);
    } else {
        statusMsg.innerText = `Nenhum clube encontrado com o nome "${termo}".`;
        document.getElementById("teamsGrid").innerHTML = "";
    }
}

// =========================================================================
// FUNÇÃO UTILITÁRIA: Exibição COM repetição (Geração dos Cards)
// =========================================================================
function exibirDadosComRepeticao(listaTimes) {
    const grid = document.getElementById("teamsGrid");
    grid.innerHTML = "";

    listaTimes.forEach(team => {
        const card = document.createElement("div");
        card.classList.add("card");
        
        // Clique aciona o Método 3 (Dados SEM repetição)
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
// MÉTODO 3 (SEM REPETIÇÃO): Consulta detalhes isolados de um clube no Modal
// =========================================================================
function buscarDetalhesSemRepeticao(idTime) {
    const modal = document.getElementById("detailModal");
    const modalBody = document.getElementById("modalBody");
    
    // Filtra o objeto único vindo do JSON retornado da API pelo ID
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

            <div style="margin: 15px 0; padding: 12px; background-color: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 4px;">
                <p style="margin: 0; color: #0369a1; font-weight: bold;">⚽ Último Confronto Registrado na API:</p>
                <p style="margin-top: 4px; color: #0c4a6e;">${t.ultimoJogo || 'Nenhum confronto registrado'}</p>
            </div>

            <h4 style="margin-top:15px;">Descrição do Clube:</h4>
            <div class="bio-text">
                ${t.strDescriptionPT}
            </div>
        `;
        modal.style.display = "flex";
    } else {
        alert("Detalhes indisponíveis para este clube.");
    }
}

function fecharModal() {
    document.getElementById("detailModal").style.display = "none";
}