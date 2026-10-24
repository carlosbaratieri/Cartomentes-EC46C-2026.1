const corpo = document.body;

const elementos = {
    barraLateral: document.querySelector(".barra-lateral"),
    alternar: document.querySelector(".alternar"),
    interruptorModo: document.querySelector(".alternar-interruptor"),
    textoModo: document.querySelector(".texto-modo"),
    linksBarraLateral: document.querySelectorAll(".barra-lateral .link-nav"),
    paginas: document.querySelectorAll(".pagina"),
};

let cartaAtualModal = null;
let colecaoAtualDetalhe = null;

const MAPA_TIPOS = {
    'Fogo': 'fire.svg',
    'Água': 'water.svg',
    'Gelo': 'ice.svg',
    'Terra': 'ground.svg',
    'Ar': 'flying.svg',
    'Elétrico': 'electric.svg',
    'Trevas': 'dark.svg',
    'Luz': 'fairy.svg',
    'Inseto': 'bug.svg',
    'Dragão': 'dragon.svg',
    'Fantasma': 'ghost.svg',
    'Grama': 'grass.svg',
    'Normal': 'normal.svg',
    'Venenoso': 'poison.svg',
    'Psíquico': 'psychic.svg',
    'Pedra': 'rock.svg',
    'Aço': 'steel.svg',
    'Lutador': 'fighting.svg'
};

const TIPOS_DISPONIVEIS = [
    'Fogo', 'Água', 'Gelo', 'Terra', 'Ar', 'Elétrico',
    'Trevas', 'Luz', 'Inseto', 'Dragão', 'Fantasma',
    'Grama', 'Normal', 'Venenoso', 'Psíquico', 'Pedra', 'Aço', 'Lutador'
];

const obterCartas = () => JSON.parse(localStorage.getItem('cartomentes_cartas') || '[]');
const salvarCartas = (cartas) => localStorage.setItem('cartomentes_cartas', JSON.stringify(cartas));

const obterColecoes = () => {
    let colecoes = JSON.parse(localStorage.getItem('cartomentes_colecoes') || '[]');
    const cartas = obterCartas();
    const idsValidos = new Set(cartas.map(c => c.id));
    colecoes = colecoes.map(col => ({
        ...col,
        cartas: col.cartas.filter(id => idsValidos.has(id))
    }));
    return colecoes;
};

const salvarColecoes = (colecoes) => {
    localStorage.setItem('cartomentes_colecoes', JSON.stringify(colecoes));
};

const alternarBarraLateral = () => {
    elementos.barraLateral?.classList.toggle("fechada");
};

const alternarTema = () => {
    corpo.classList.toggle("escuro");
    const isEscuro = corpo.classList.contains("escuro");
    if (elementos.textoModo) {
        elementos.textoModo.textContent = isEscuro ? "Modo Claro" : "Modo Escuro";
    }
    localStorage.setItem("cartomentes_tema", isEscuro ? "escuro" : "claro");
};

const carregarTema = () => {
    const tema = localStorage.getItem("cartomentes_tema");
    if (tema === "escuro") {
        corpo.classList.add("escuro");
        if (elementos.textoModo) elementos.textoModo.textContent = "Modo Claro";
    }
};

const navegarPara = (targetId) => {
    elementos.paginas.forEach(pagina => {
        pagina.style.display = "none";
    });
    const paginaAlvo = document.getElementById(targetId);
    if (paginaAlvo) {
        paginaAlvo.style.display = "block";
    }
    elementos.linksBarraLateral.forEach(link => {
        link.classList.remove("ativo");
        if (link.dataset.target === targetId) {
            link.classList.add("ativo");
        }
    });
    if (targetId === 'criacao') {
        atualizarPreview();
    }
    if (targetId === 'cartas') {
        renderizarCartas();
    }
    if (targetId === 'favoritos') {
        renderizarFavoritos();
    }
    if (targetId === 'colecoes') {
        renderizarColecoes();
    }
};

const criarOnda = (evento) => {
    const botao = evento.currentTarget;
    const retangulo = botao.getBoundingClientRect();
    botao.querySelector(".ripple")?.remove();
    const onda = document.createElement("span");
    onda.className = "ripple";
    const tamanho = Math.max(retangulo.width, retangulo.height);
    const x = evento.clientX - retangulo.left - tamanho / 2;
    const y = evento.clientY - retangulo.top - tamanho / 2;
    Object.assign(onda.style, {
        width: `${tamanho}px`,
        height: `${tamanho}px`,
        left: `${x}px`,
        top: `${y}px`,
    });
    botao.appendChild(onda);
    onda.addEventListener("animationend", () => onda.remove());
};

const configurarContadorPalavras = () => {
    const descricao = document.getElementById("descricao-carta");
    const contador = document.querySelector(".contador-palavras");
    if (!descricao || !contador) return;
    const atualizarContador = () => {
        const texto = descricao.value.trim();
        const palavras = texto ? texto.split(/\s+/).length : 0;
        const limite = 120;
        contador.textContent = `${palavras}/${limite} palavras`;
        if (palavras > limite) {
            contador.classList.add("limite-atingido");
            const palavrasExcedentes = texto.split(/\s+/).slice(0, limite).join(" ");
            descricao.value = palavrasExcedentes;
            atualizarContador();
        } else {
            contador.classList.remove("limite-atingido");
        }
        atualizarPreview();
    };
    descricao.addEventListener("input", atualizarContador);
    atualizarContador();
};

const configurarControlesAtributos = () => {
    const botoesMais = document.querySelectorAll(".btn-mais");
    const botoesMenos = document.querySelectorAll(".btn-menos");
    const atualizarValor = (container, delta) => {
        const valorSpan = container.querySelector(".valor-atributo");
        let valor = parseInt(valorSpan.textContent, 10) || 0;
        valor = Math.max(0, valor + delta);
        valorSpan.textContent = valor;
        atualizarPreview();
    };
    botoesMais.forEach(botao => {
        botao.addEventListener("click", (e) => {
            e.stopPropagation();
            const container = botao.closest(".controle-numero");
            atualizarValor(container, 1);
        });
    });
    botoesMenos.forEach(botao => {
        botao.addEventListener("click", (e) => {
            e.stopPropagation();
            const container = botao.closest(".controle-numero");
            atualizarValor(container, -1);
        });
    });
};

const configurarTags = () => {
    const btnAdicionar = document.querySelector(".btn-adicionar-tag");
    const areaTags = document.querySelector(".area-tags");
    const inputNovaTag = document.querySelector(".input-nova-tag");
    if (!btnAdicionar || !areaTags || !inputNovaTag) return;

    const MAX_TAGS = 3;
    const obterQuantidadeTags = () => areaTags.querySelectorAll(".tag-item").length;

    const configurarRemocaoTag = (tagItem) => {
        const removerBtn = tagItem.querySelector(".remover-tag");
        if (removerBtn) {
            removerBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                tagItem.remove();
                if (obterQuantidadeTags() < MAX_TAGS) {
                    btnAdicionar.style.display = "flex";
                }
                atualizarPreview();
            });
        }
    };

    document.querySelectorAll(".tag-item").forEach(configurarRemocaoTag);

    const adicionarTag = (texto) => {
        if (obterQuantidadeTags() >= MAX_TAGS) {
            alert(`Limite de ${MAX_TAGS} tags atingido.`);
            return false;
        }
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag-item";
        const textNode = document.createTextNode(texto);
        tagSpan.appendChild(textNode);
        const removerBtn = document.createElement("span");
        removerBtn.className = "remover-tag";
        removerBtn.textContent = "×";
        removerBtn.addEventListener("click", () => {
            tagSpan.remove();
            if (obterQuantidadeTags() < MAX_TAGS) {
                btnAdicionar.style.display = "flex";
            }
            atualizarPreview();
        });
        tagSpan.appendChild(removerBtn);
        areaTags.insertBefore(tagSpan, btnAdicionar);
        if (obterQuantidadeTags() >= MAX_TAGS) {
            btnAdicionar.style.display = "none";
        }
        atualizarPreview();
        return true;
    };

    btnAdicionar.addEventListener("click", () => {
        if (obterQuantidadeTags() >= MAX_TAGS) {
            alert(`Limite de ${MAX_TAGS} tags atingido.`);
            return;
        }
        inputNovaTag.style.display = "inline-block";
        inputNovaTag.focus();
        btnAdicionar.style.display = "none";
    });

    inputNovaTag.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const tagTexto = inputNovaTag.value.trim();
            if (tagTexto) {
                const sucesso = adicionarTag(tagTexto);
                if (sucesso) {
                    inputNovaTag.value = "";
                    inputNovaTag.focus();
                }
            }
        }
    });

    inputNovaTag.addEventListener("blur", () => {
        if (!inputNovaTag.value.trim()) {
            inputNovaTag.style.display = "none";
            if (obterQuantidadeTags() < MAX_TAGS) {
                btnAdicionar.style.display = "flex";
            }
        }
    });

    if (obterQuantidadeTags() === 0) {
        btnAdicionar.style.display = "flex";
    } else if (obterQuantidadeTags() >= MAX_TAGS) {
        btnAdicionar.style.display = "none";
    }
};

const configurarUploadImagem = () => {
    const areaUpload = document.querySelector(".area-upload");
    const inputFile = areaUpload?.querySelector("input[type='file']");
    const botaoSelecionar = areaUpload?.querySelector(".botao-selecionar");
    if (!areaUpload || !inputFile || !botaoSelecionar) return;

    botaoSelecionar.addEventListener("click", (e) => {
        e.stopPropagation();
        inputFile.click();
    });
    areaUpload.addEventListener("click", () => {
        inputFile.click();
    });

    inputFile.addEventListener("change", (e) => {
        const arquivo = e.target.files[0];
        if (arquivo) {
            if (arquivo.size > 5 * 1024 * 1024) {
                alert("A imagem deve ter no máximo 5MB.");
                inputFile.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                const hidden = document.getElementById('imagem-base64');
                if (hidden) hidden.value = base64;
                areaUpload.querySelectorAll("p.mensagem-upload").forEach(p => p.remove());
                const novaMsg = document.createElement("p");
                novaMsg.className = "mensagem-upload";
                novaMsg.textContent = ` ${arquivo.name}`;
                areaUpload.appendChild(novaMsg);
                atualizarPreview();
            };
            reader.readAsDataURL(arquivo);
        }
    });

    areaUpload.addEventListener("dragover", (e) => {
        e.preventDefault();
        areaUpload.style.borderColor = "var(--cor-primaria)";
        areaUpload.style.background = "var(--cor-primaria-clara)";
    });

    areaUpload.addEventListener("dragleave", () => {
        areaUpload.style.borderColor = "var(--cor-borda)";
        areaUpload.style.background = "var(--cor-fundo-campo)";
    });

    areaUpload.addEventListener("drop", (e) => {
        e.preventDefault();
        areaUpload.style.borderColor = "var(--cor-borda)";
        areaUpload.style.background = "var(--cor-fundo-campo)";
        const arquivo = e.dataTransfer.files[0];
        if (arquivo) {
            if (arquivo.size > 5 * 1024 * 1024) {
                alert("A imagem deve ter no máximo 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                const hidden = document.getElementById('imagem-base64');
                if (hidden) hidden.value = base64;
                areaUpload.querySelectorAll("p.mensagem-upload").forEach(p => p.remove());
                const novaMsg = document.createElement("p");
                novaMsg.className = "mensagem-upload";
                novaMsg.textContent = ` ${arquivo.name}`;
                areaUpload.appendChild(novaMsg);
                atualizarPreview();
            };
            reader.readAsDataURL(arquivo);
        }
    });
};

const popularGradeTipos = () => {
    const container = document.getElementById('grade-tipos');
    if (!container) return;
    container.innerHTML = '';
    TIPOS_DISPONIVEIS.forEach(tipo => {
        const nomeArquivo = MAPA_TIPOS[tipo] || 'normal.svg';
        const div = document.createElement('div');
        div.className = 'opcao-tipo';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'tipo_carta';
        radio.value = tipo;
        radio.id = `tipo_${tipo}`;
        const img = document.createElement('img');
        img.src = `assets/${nomeArquivo}`;
        img.alt = tipo;
        const label = document.createElement('label');
        label.htmlFor = `tipo_${tipo}`;
        label.textContent = tipo;

        div.appendChild(radio);
        div.appendChild(img);
        div.appendChild(label);
        container.appendChild(div);

        radio.addEventListener('change', () => {
            container.querySelectorAll('.opcao-tipo').forEach(el => el.classList.remove('selecionado'));
            if (radio.checked) div.classList.add('selecionado');
            atualizarPreview();
        });

        div.addEventListener('click', (e) => {
            if (e.target.tagName === 'LABEL' || e.target.tagName === 'IMG') return;
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        });
    });

    const primeiroRadio = container.querySelector('input[type="radio"]');
    if (primeiroRadio) {
        primeiroRadio.checked = true;
        primeiroRadio.closest('.opcao-tipo')?.classList.add('selecionado');
    }
};

const obterTipoSelecionado = () => {
    const radio = document.querySelector('.grade-tipos input[type="radio"]:checked');
    return radio ? radio.value : 'Fogo';
};

const atualizarPreview = () => {
    const nome = document.getElementById('nome-carta')?.value?.trim() || 'Sem nome';
    const tipo = obterTipoSelecionado();
    const descricao = document.getElementById('descricao-carta')?.value?.trim() || '';
    const raridade = document.querySelector('input[name="raridade"]:checked')?.value || 'Comum';
    const custo = parseInt(document.querySelector('.valor-atributo[data-atributo="custo"]')?.textContent) || 0;
    const atk = parseInt(document.querySelector('.valor-atributo[data-atributo="atk"]')?.textContent) || 0;
    const vida = parseInt(document.querySelector('.valor-atributo[data-atributo="vida"]')?.textContent) || 0;
    const def = parseInt(document.querySelector('.valor-atributo[data-atributo="def"]')?.textContent) || 0;
    const imagem = document.getElementById('imagem-base64')?.value || '';
    const corFundo = document.getElementById('cor-fundo')?.value || '#cca43b';
    const corBorda = document.getElementById('cor-borda')?.value || '#cca43b';
    const corCorpo = document.getElementById('cor-corpo')?.value || '#151518';

    const cartaPreview = document.getElementById('carta-preview');
    const nomeEl = document.getElementById('preview-nome');
    const tipoEl = document.getElementById('preview-tipo');
    const imagemEl = document.getElementById('preview-imagem');
    const raridadeEl = document.getElementById('preview-raridade');
    const custoEl = document.getElementById('preview-custo');
    const atkEl = document.getElementById('preview-atk');
    const defEl = document.getElementById('preview-def');
    const descricaoEl = document.getElementById('preview-descricao');
    const tagsEl = document.getElementById('preview-tags');
    const vidaValorEl = document.getElementById('preview-vida-valor');

    if (cartaPreview) {
        cartaPreview.style.setProperty('--cor-fundo-carta', corFundo);
        cartaPreview.style.setProperty('--cor-borda-carta', corBorda);
        cartaPreview.style.background = `linear-gradient(135deg, ${corFundo}, ${corFundo}dd, ${corFundo})`;
        const corpoCarta = cartaPreview.querySelector('.corpo-da-carta');
        if (corpoCarta) {
            corpoCarta.style.borderColor = corBorda;
            corpoCarta.style.background = `linear-gradient(145deg, ${corCorpo}, ${corCorpo}dd)`;
        }
        const tipos = ['fogo', 'agua', 'gelo', 'terra', 'ar', 'eletrico', 'trevas', 'luz'];
        tipos.forEach(t => cartaPreview.classList.remove(`tipo-${t}`));
        const tipoNormalizado = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (tipos.includes(tipoNormalizado)) {
            cartaPreview.classList.add(`tipo-${tipoNormalizado}`);
        }
    }

    if (nomeEl) nomeEl.textContent = nome;
    if (tipoEl) {
        const nomeArquivo = MAPA_TIPOS[tipo] || 'normal.svg';
        tipoEl.innerHTML = `<img src="assets/${nomeArquivo}" alt="${tipo}" class="icone-tipo">`;
    }
    if (imagemEl) {
        if (imagem) {
            imagemEl.src = imagem;
        } else {
            imagemEl.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="190" viewBox="0 0 300 190"%3E%3Crect width="300" height="190" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="20" fill="%23aaa" text-anchor="middle" dy=".3em"%3EArte da carta%3C/text%3E%3C/svg%3E';
        }
    }
    if (raridadeEl) {
        const icones = {
            'Comum': '',
            'Raro': '⭐ ',
            'Épico': '✨ ',
            'Lendário': '🌟 '
        };
        raridadeEl.textContent = `${icones[raridade] || ''}${raridade}`;
    }
    if (custoEl) custoEl.textContent = `Custo: ${custo}`;
    if (atkEl) atkEl.textContent = atk;
    if (defEl) defEl.textContent = def;
    if (descricaoEl) descricaoEl.textContent = descricao || 'Sem descrição';
    if (vidaValorEl) vidaValorEl.textContent = vida;

    if (tagsEl) {
        const tags = Array.from(document.querySelectorAll('.area-tags .tag-item:not(.btn-adicionar-tag)'))
            .map(el => el.textContent.replace('×', '').trim());
        tagsEl.innerHTML = tags.map(t => `<span>${t}</span>`).join('');
    }
};

const salvarPreviewComoPNG = () => {
    const cartaPreview = document.getElementById('carta-preview');
    if (!cartaPreview) return;
    const imagens = cartaPreview.querySelectorAll('img');
    imagens.forEach(img => {
        if (!img.src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
    });
    html2canvas(cartaPreview, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        logging: false,
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'carta.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        alert('Erro ao salvar a imagem: ' + err.message + '\nTente usar uma imagem própria (upload) para evitar problemas de CORS.');
    });
};

const renderizarColecoes = () => {
    const grid = document.getElementById('colecoes-grid');
    const empty = document.getElementById('empty-colecoes');
    const buscaInput = document.getElementById('busca-colecoes');
    if (!grid) return;

    let colecoes = obterColecoes();
    const termoBusca = buscaInput?.value?.toLowerCase()?.trim() || '';

    if (termoBusca) {
        colecoes = colecoes.filter(c => c.nome.toLowerCase().includes(termoBusca));
    }

    if (colecoes.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    grid.innerHTML = colecoes.map((col, index) => {
        const totalCartas = col.cartas.length;
        return `
            <div class="pasta-item" data-index="${index}">
                <div class="icone-pasta">📁</div>
                <div class="nome-pasta">${col.nome}</div>
                <div class="contagem-pasta">${totalCartas} carta${totalCartas !== 1 ? 's' : ''}</div>
                <div class="acoes-pasta">
                    <button class="btn-abrir-pasta" title="Abrir coleção"><i class="fas fa-eye"></i></button>
                    <button class="btn-excluir-pasta" title="Excluir coleção"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.pasta-item').forEach(item => {
        const index = parseInt(item.dataset.index);
        const btnAbrir = item.querySelector('.btn-abrir-pasta');
        const btnExcluir = item.querySelector('.btn-excluir-pasta');

        btnAbrir.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirDetalhesColecao(index);
        });

        btnExcluir.addEventListener('click', (e) => {
            e.stopPropagation();
            const colecoesAtual = obterColecoes();
            if (confirm(`Tem certeza que deseja excluir a coleção "${colecoesAtual[index].nome}"?`)) {
                let colecoesAtualizadas = obterColecoes();
                colecoesAtualizadas.splice(index, 1);
                salvarColecoes(colecoesAtualizadas);
                renderizarColecoes();
            }
        });

        item.addEventListener('click', () => {
            abrirDetalhesColecao(index);
        });
    });
};

const abrirDetalhesColecao = (index) => {
    const colecoes = obterColecoes();
    if (!colecoes[index]) return;
    colecaoAtualDetalhe = index;
    const col = colecoes[index];

    const modal = document.getElementById('modal-detalhe-colecao');
    const titulo = document.getElementById('titulo-detalhe-colecao');
    const inputNome = document.getElementById('editar-nome-colecao');
    const contagem = document.getElementById('contagem-cartas-colecao');
    const container = document.getElementById('cartas-na-colecao');

    titulo.textContent = `📁 ${col.nome}`;
    inputNome.value = col.nome;
    contagem.textContent = `${col.cartas.length} carta${col.cartas.length !== 1 ? 's' : ''}`;

    const todasCartas = obterCartas();
    const cartasNaColecao = col.cartas.map(id => todasCartas.find(c => c.id === id)).filter(Boolean);

    if (cartasNaColecao.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: var(--cor-texto); opacity:0.7; padding:20px;">Nenhuma carta nesta coleção.</p>`;
    } else {
        container.innerHTML = cartasNaColecao.map(carta => `
            <div class="carta-mini-colecao" data-id="${carta.id}">
                <img src="${carta.imagem || 'https://picsum.photos/150/80'}" alt="${carta.nome}" loading="lazy">
                <div class="info-mini" title="${carta.nome}">${carta.nome}</div>
                <button class="btn-remover-da-colecao" title="Remover desta coleção"><i class="fas fa-times"></i> Remover</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-remover-da-colecao').forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.carta-mini-colecao');
                const id = card.dataset.id;
                if (confirm(`Remover "${cartasNaColecao[idx].nome}" da coleção?`)) {
                    let colecoesAtualizadas = obterColecoes();
                    const colAtual = colecoesAtualizadas[colecaoAtualDetalhe];
                    if (colAtual) {
                        colAtual.cartas = colAtual.cartas.filter(cId => cId !== id);
                        salvarColecoes(colecoesAtualizadas);
                        abrirDetalhesColecao(colecaoAtualDetalhe);
                        renderizarColecoes();
                    }
                }
            });
        });
    }

    modal.style.display = 'flex';
};

const fecharDetalhesColecao = () => {
    document.getElementById('modal-detalhe-colecao').style.display = 'none';
    colecaoAtualDetalhe = null;
};

const renomearColecao = () => {
    if (colecaoAtualDetalhe === null) return;
    const input = document.getElementById('editar-nome-colecao');
    const novoNome = input.value.trim();
    if (!novoNome) {
        alert('Digite um nome válido.');
        return;
    }
    let colecoes = obterColecoes();
    if (colecoes[colecaoAtualDetalhe]) {
        colecoes[colecaoAtualDetalhe].nome = novoNome;
        salvarColecoes(colecoes);
        abrirDetalhesColecao(colecaoAtualDetalhe);
        renderizarColecoes();
    }
};

const excluirColecaoDoModal = () => {
    if (colecaoAtualDetalhe === null) return;
    const colecoes = obterColecoes();
    if (!colecoes[colecaoAtualDetalhe]) return;
    if (confirm(`Tem certeza que deseja excluir a coleção "${colecoes[colecaoAtualDetalhe].nome}"?`)) {
        let colecoesAtualizadas = obterColecoes();
        colecoesAtualizadas.splice(colecaoAtualDetalhe, 1);
        salvarColecoes(colecoesAtualizadas);
        fecharDetalhesColecao();
        renderizarColecoes();
    }
};

const abrirModalAdicionarCartas = () => {
    if (colecaoAtualDetalhe === null) return;
    const modal = document.getElementById('modal-colecao');
    const grid = document.getElementById('grid-cartas-modal');
    const cartas = obterCartas();

    if (cartas.length === 0) {
        alert('Crie algumas cartas primeiro!');
        return;
    }

    const colecoes = obterColecoes();
    const col = colecoes[colecaoAtualDetalhe];
    const idsNaColecao = new Set(col.cartas);

    grid.innerHTML = cartas.map(carta => `
        <div class="card-carta selecionavel ${idsNaColecao.has(carta.id) ? 'selecionado' : ''}" data-id="${carta.id}">
            <div class="imagem-carta" style="background: #7f5af0; height:80px; border-radius:8px; background-image: url('${carta.imagem || 'https://picsum.photos/150/80'}'); background-size:cover; background-position:center;"></div>
            <div class="info-carta">
                <span class="nome-carta">${carta.nome}</span>
                <span class="tipo-carta">${carta.tipo}</span>
                <span class="raridade-carta">${carta.raridade}</span>
            </div>
            <span class="check-indicador">✔</span>
        </div>
    `).join('');

    grid.querySelectorAll('.card-carta.selecionavel').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selecionado');
        });
    });

    const btnSalvar = document.getElementById('salvar-modal-colecao');
    const btnCancelar = document.getElementById('cancelar-modal-colecao');
    const btnFechar = document.getElementById('fechar-modal-colecao');

    const salvarAdicao = () => {
        const selecionados = document.querySelectorAll('.card-carta.selecionavel.selecionado');
        const ids = Array.from(selecionados).map(card => card.dataset.id);
        let colecoesAtualizadas = obterColecoes();
        if (colecoesAtualizadas[colecaoAtualDetalhe]) {
            colecoesAtualizadas[colecaoAtualDetalhe].cartas = ids;
            salvarColecoes(colecoesAtualizadas);
            fecharModalColecao();
            abrirDetalhesColecao(colecaoAtualDetalhe);
            renderizarColecoes();
        }
    };

    const fecharModalColecao = () => {
        modal.style.display = 'none';
        btnSalvar.removeEventListener('click', salvarAdicao);
        btnSalvar.addEventListener('click', salvarModalColecaoOriginal);
        btnCancelar.removeEventListener('click', fecharModalColecao);
        btnCancelar.addEventListener('click', cancelarModalColecaoOriginal);
        btnFechar.removeEventListener('click', fecharModalColecao);
        btnFechar.addEventListener('click', fecharModalColecaoOriginal);
    };

    const salvarModalColecaoOriginal = btnSalvar._listeners ? btnSalvar._listeners.click : null;
    const cancelarModalColecaoOriginal = btnCancelar._listeners ? btnCancelar._listeners.click : null;
    const fecharModalColecaoOriginal = btnFechar._listeners ? btnFechar._listeners.click : null;

    btnSalvar.replaceWith(btnSalvar.cloneNode(true));
    btnCancelar.replaceWith(btnCancelar.cloneNode(true));
    btnFechar.replaceWith(btnFechar.cloneNode(true));

    const novoBtnSalvar = document.getElementById('salvar-modal-colecao');
    const novoBtnCancelar = document.getElementById('cancelar-modal-colecao');
    const novoBtnFechar = document.getElementById('fechar-modal-colecao');

    novoBtnSalvar.addEventListener('click', salvarAdicao);
    novoBtnCancelar.addEventListener('click', fecharModalColecao);
    novoBtnFechar.addEventListener('click', fecharModalColecao);

    modal.style.display = 'flex';
};

const configurarModalColecao = () => {
    const modal = document.getElementById("modal-colecao");
    const btnAbrir = document.getElementById("botao-abrir-modal-colecao");
    const btnFechar = document.getElementById("fechar-modal-colecao");
    const btnCancelar = document.getElementById("cancelar-modal-colecao");
    const btnSalvar = document.getElementById("salvar-modal-colecao");
    const gridModal = document.getElementById("grid-cartas-modal");

    if (!modal || !btnAbrir || !btnFechar || !btnCancelar || !btnSalvar || !gridModal) return;

    const abrirModal = () => {
        const cartas = obterCartas();
        if (cartas.length === 0) {
            alert('Crie algumas cartas primeiro!');
            return;
        }
        gridModal.innerHTML = cartas.map(carta => `
            <div class="card-carta selecionavel" data-id="${carta.id}">
                <div class="imagem-carta" style="background: #7f5af0; height:80px; border-radius:8px; background-image: url('${carta.imagem || 'https://picsum.photos/150/80'}'); background-size:cover; background-position:center;"></div>
                <div class="info-carta">
                    <span class="nome-carta">${carta.nome}</span>
                    <span class="tipo-carta">${carta.tipo}</span>
                    <span class="raridade-carta">${carta.raridade}</span>
                </div>
                <span class="check-indicador">✔</span>
            </div>
        `).join('');

        gridModal.querySelectorAll('.card-carta.selecionavel').forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('selecionado');
            });
        });

        modal.style.display = "flex";
    };

    const fecharModal = () => {
        modal.style.display = "none";
        gridModal.querySelectorAll('.card-carta.selecionavel').forEach(card => {
            card.classList.remove('selecionado');
        });
    };

    btnAbrir.addEventListener("click", abrirModal);
    btnFechar.addEventListener("click", fecharModal);
    btnCancelar.addEventListener("click", fecharModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });

    btnSalvar.addEventListener("click", () => {
        const selecionados = document.querySelectorAll(".card-carta.selecionavel.selecionado");
        if (selecionados.length === 0) {
            alert("Selecione pelo menos uma carta para criar a coleção.");
            return;
        }
        const ids = Array.from(selecionados).map(card => card.dataset.id);
        const nomeColecao = prompt("Nome da coleção:", "Nova Coleção");
        if (!nomeColecao) return;
        let colecoes = obterColecoes();
        colecoes = colecoes.filter(c => c.cartas.length > 0);
        colecoes.push({ nome: nomeColecao, cartas: ids });
        salvarColecoes(colecoes);
        alert(` Coleção "${nomeColecao}" criada com ${ids.length} carta(s)!`);
        fecharModal();
        renderizarColecoes();
    });
};

const configurarEventosListaCartas = () => {
    const buscaInput = document.getElementById('busca-cartas');
    const ordenarSelect = document.getElementById('ordenar-select');

    if (buscaInput) {
        buscaInput.addEventListener('input', renderizarCartas);
    }
    if (ordenarSelect) {
        ordenarSelect.addEventListener('change', renderizarCartas);
    }

    const buscaFavoritos = document.getElementById('busca-favoritos');
    if (buscaFavoritos) {
        buscaFavoritos.addEventListener('input', renderizarFavoritos);
    }

    const buscaColecoes = document.getElementById('busca-colecoes');
    if (buscaColecoes) {
        buscaColecoes.addEventListener('input', renderizarColecoes);
    }
};

const configurarModalVisualizacao = () => {
    const modal = document.getElementById('modal-visualizacao');
    const fechar = document.getElementById('fechar-modal-visualizacao');
    const btnFavoritar = document.getElementById('btn-favoritar-modal');
    const btnAdicionar = document.getElementById('btn-adicionar-colecao-modal');
    const btnExcluir = document.getElementById('btn-excluir-modal');

    if (!modal || !fechar || !btnFavoritar || !btnAdicionar || !btnExcluir) return;

    fechar.addEventListener('click', fecharModalVisualizacao);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalVisualizacao();
    });
    btnFavoritar.addEventListener('click', toggleFavorito);
    btnAdicionar.addEventListener('click', adicionarCartaAColecao);
    btnExcluir.addEventListener('click', excluirCarta);
};

const renderizarCartaGrande = (carta) => {
    const wrapper = document.getElementById('carta-grande-wrapper');
    if (!wrapper) return;
    const tipoNormalizado = carta.tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const classeTipo = ['fogo','agua','gelo','terra','ar','eletrico','trevas','luz'].includes(tipoNormalizado) ? `tipo-${tipoNormalizado}` : '';
    const iconesRaridade = {
        'Comum': '',
        'Raro': '⭐ ',
        'Épico': '✨ ',
        'Lendário': '🌟 '
    };
    const imagemSrc = carta.imagem || 'https://picsum.photos/300/190';
    const nomeArquivo = MAPA_TIPOS[carta.tipo] || 'normal.svg';
    const iconeTipo = `<img src="assets/${nomeArquivo}" alt="${carta.tipo}" class="icone-tipo">`;
    const vida = carta.vida || 0;
    const corFundo = carta.corFundo || '#cca43b';
    const corBorda = carta.corBorda || '#cca43b';
    const corCorpo = carta.corCorpo || '#151518';

    wrapper.innerHTML = `
        <div class="carta-generica-tcg ${classeTipo} sem-hover" style="background: linear-gradient(135deg, ${corFundo}, ${corFundo}dd, ${corFundo}); --cor-fundo-carta: ${corFundo}; --cor-borda-carta: ${corBorda};">
            <div class="corpo-da-carta" style="border-color: ${corBorda}; background: linear-gradient(145deg, ${corCorpo}, ${corCorpo}dd);">
                <div class="cabecalho-da-carta">
                    <span class="nome-do-personagem">${carta.nome}</span>
                    <div class="tipo-de-energia">${iconeTipo}</div>
                </div>
                <div class="moldura-da-imagem">
                    <img class="arte-da-carta" src="${imagemSrc}" alt="${carta.nome}">
                </div>
                <div class="barra-de-especificacoes">
                    <span class="raridade-da-carta">${iconesRaridade[carta.raridade] || ''}${carta.raridade}</span>
                    <span class="custo-da-carta">Custo: ${carta.custo}</span>
                </div>
                <div class="conteiner-de-atributos">
                    <div class="grade-de-atributos">
                        <div class="item-de-atributo">
                            <span class="rotulo-do-atributo">ATK</span>
                            <span class="valor-do-atributo">${carta.atk}</span>
                        </div>
                        <div class="item-de-atributo">
                            <span class="rotulo-do-atributo">DEF</span>
                            <span class="valor-do-atributo">${carta.def}</span>
                        </div>
                        <div class="item-de-atributo">
                            <span class="rotulo-do-atributo">Vida</span>
                            <span class="valor-do-atributo">${vida}</span>
                        </div>
                    </div>
                    <p class="descricao-da-carta">${carta.descricao || 'Sem descrição'}</p>
                    ${carta.tags && carta.tags.length ? `
                        <div class="preview-tags">
                            ${carta.tags.map(t => `<span>${t}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
};

const abrirModalVisualizacao = (cartaId) => {
    const cartas = obterCartas();
    const carta = cartas.find(c => c.id === cartaId);
    if (!carta) return;
    cartaAtualModal = carta;
    renderizarCartaGrande(carta);
    const modal = document.getElementById('modal-visualizacao');
    modal.style.display = 'flex';
    const btnFavoritar = document.getElementById('btn-favoritar-modal');
    const icone = btnFavoritar.querySelector('i');
    if (carta.favorito) {
        icone.className = 'bx bxs-heart';
        btnFavoritar.classList.add('favoritado');
    } else {
        icone.className = 'bx bx-heart';
        btnFavoritar.classList.remove('favoritado');
    }
    const select = document.getElementById('select-colecao-modal');
    const colecoes = obterColecoes();
    select.innerHTML = '<option value="">Selecione uma coleção</option>';
    colecoes.forEach((col, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = col.nome;
        select.appendChild(option);
    });
};

const fecharModalVisualizacao = () => {
    document.getElementById('modal-visualizacao').style.display = 'none';
    cartaAtualModal = null;
};

const toggleFavorito = () => {
    if (!cartaAtualModal) return;
    let cartas = obterCartas();
    const index = cartas.findIndex(c => c.id === cartaAtualModal.id);
    if (index === -1) return;
    cartas[index].favorito = !cartas[index].favorito;
    salvarCartas(cartas);
    cartaAtualModal = cartas[index];
    const btnFavoritar = document.getElementById('btn-favoritar-modal');
    const icone = btnFavoritar.querySelector('i');
    if (cartaAtualModal.favorito) {
        icone.className = 'bx bxs-heart';
        btnFavoritar.classList.add('favoritado');
    } else {
        icone.className = 'bx bx-heart';
        btnFavoritar.classList.remove('favoritado');
    }
    renderizarCartas();
    const abaFavoritos = document.getElementById('favoritos');
    if (abaFavoritos && abaFavoritos.style.display !== 'none') {
        renderizarFavoritos();
    }
};

const adicionarCartaAColecao = () => {
    if (!cartaAtualModal) return;
    const select = document.getElementById('select-colecao-modal');
    const index = parseInt(select.value);
    if (isNaN(index) || index < 0) {
        alert('Selecione uma coleção válida.');
        return;
    }
    let colecoes = obterColecoes();
    if (!colecoes[index]) {
        alert('Coleção não encontrada.');
        return;
    }
    if (!colecoes[index].cartas.includes(cartaAtualModal.id)) {
        colecoes[index].cartas.push(cartaAtualModal.id);
        salvarColecoes(colecoes);
        alert(`Carta adicionada à coleção "${colecoes[index].nome}"!`);
    } else {
        alert('Esta carta já está na coleção selecionada.');
    }
};

const excluirCarta = () => {
    if (!cartaAtualModal) {
        alert('Nenhuma carta selecionada para excluir.');
        return;
    }
    if (!confirm(`Tem certeza que deseja excluir a carta "${cartaAtualModal.nome}"?`)) return;

    let cartas = obterCartas();
    const id = cartaAtualModal.id;
    const novaLista = cartas.filter(c => c.id !== id);
    if (novaLista.length === cartas.length) {
        alert('Erro: carta não encontrada para exclusão.');
        return;
    }
    salvarCartas(novaLista);
    fecharModalVisualizacao();

    renderizarCartas();
    const abaFavoritos = document.getElementById('favoritos');
    if (abaFavoritos && abaFavoritos.style.display !== 'none') {
        renderizarFavoritos();
    }
    renderizarColecoes();
};

const criarMiniaturaHTML = (carta) => {
    const tipoNormalizado = carta.tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const classeTipo = ['fogo','agua','gelo','terra','ar','eletrico','trevas','luz'].includes(tipoNormalizado) ? `tipo-${tipoNormalizado}` : '';
    const iconesRaridade = {
        'Comum': '',
        'Raro': '⭐ ',
        'Épico': '✨ ',
        'Lendário': '🌟 '
    };
    const imagemSrc = carta.imagem || 'https://picsum.photos/300/190';
    const favoritoIcon = carta.favorito ? '<i class="bx bxs-heart" style="color:#e74c3c; font-size:1rem; margin-left:4px;"></i>' : '';
    const nomeArquivo = MAPA_TIPOS[carta.tipo] || 'normal.svg';
    const iconeTipo = `<img src="assets/${nomeArquivo}" alt="${carta.tipo}" class="icone-tipo-mini">`;
    const vida = carta.vida || 0;

    return `
        <div class="carta-miniatura ${classeTipo}" data-id="${carta.id}">
            <div class="corpo-miniatura">
                <div class="cabecalho-miniatura">
                    <span class="nome-miniatura" title="${carta.nome}">${carta.nome} ${favoritoIcon}</span>
                    <span class="tipo-miniatura">${iconeTipo}</span>
                </div>
                <div class="moldura-miniatura">
                    <img src="${imagemSrc}" alt="${carta.nome}" loading="lazy">
                </div>
                <div class="barra-miniatura">
                    <span class="raridade-miniatura">${iconesRaridade[carta.raridade] || ''}${carta.raridade}</span>
                    <span class="custo-miniatura">Custo: ${carta.custo}</span>
                </div>
                <div class="atributos-miniatura">
                    <div class="atributo-mini">
                        <span class="rotulo-mini">ATK</span>
                        <span class="valor-mini">${carta.atk}</span>
                    </div>
                    <div class="atributo-mini">
                        <span class="rotulo-mini">Vida</span>
                        <span class="valor-mini">${vida}</span>
                    </div>
                    <div class="atributo-mini">
                        <span class="rotulo-mini">DEF</span>
                        <span class="valor-mini">${carta.def}</span>
                    </div>
                </div>
                <p class="descricao-miniatura">${carta.descricao || 'Sem descrição'}</p>
                ${carta.tags && carta.tags.length ? `
                    <div class="tags-miniatura">
                        ${carta.tags.map(t => `<span>${t}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

const renderizarCartas = () => {
    const grid = document.getElementById('grid-cartas');
    const empty = document.getElementById('empty-cartas');
    const filtrosContainer = document.getElementById('filtros-tags');
    const buscaInput = document.getElementById('busca-cartas');
    const ordenarSelect = document.getElementById('ordenar-select');

    if (!grid) return;

    let cartas = obterCartas();

    const tagAtiva = document.querySelector('#filtros-tags .filtro-ativo')?.dataset?.tag || 'todas';
    const termoBusca = buscaInput?.value?.toLowerCase()?.trim() || '';
    const ordenacao = ordenarSelect?.value || 'recentes';

    let cartasFiltradas = [...cartas];

    if (tagAtiva !== 'todas') {
        cartasFiltradas = cartasFiltradas.filter(c => c.tags && c.tags.includes(tagAtiva));
    }

    if (termoBusca) {
        cartasFiltradas = cartasFiltradas.filter(c =>
            c.nome.toLowerCase().includes(termoBusca) ||
            c.tipo.toLowerCase().includes(termoBusca) ||
            c.descricao.toLowerCase().includes(termoBusca) ||
            (c.tags && c.tags.some(t => t.toLowerCase().includes(termoBusca)))
        );
    }

    switch (ordenacao) {
        case 'recentes':
            cartasFiltradas.sort((a, b) => b.criadoEm - a.criadoEm);
            break;
        case 'antigas':
            cartasFiltradas.sort((a, b) => a.criadoEm - b.criadoEm);
            break;
        case 'az':
            cartasFiltradas.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
        case 'za':
            cartasFiltradas.sort((a, b) => b.nome.localeCompare(a.nome));
            break;
    }

    if (cartas.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('vazio');
        empty.style.display = 'flex';
        empty.querySelector('h2').textContent = 'Nenhuma carta ainda';
        empty.querySelector('p').textContent = 'Comece criando sua primeira carta!';
        filtrosContainer.innerHTML = `<button class="filtro-ativo" data-tag="todas">Todas (0)</button>`;
        return;
    }

    empty.style.display = 'none';

    const todasTags = new Set();
    cartas.forEach(c => {
        if (c.tags && Array.isArray(c.tags)) {
            c.tags.forEach(t => todasTags.add(t));
        }
    });

    let filtrosHTML = `<button class="${tagAtiva === 'todas' ? 'filtro-ativo' : ''}" data-tag="todas">Todas (${cartas.length})</button>`;
    todasTags.forEach(tag => {
        const count = cartas.filter(c => c.tags && c.tags.includes(tag)).length;
        const ativo = (tagAtiva === tag) ? 'filtro-ativo' : '';
         filtrosHTML += `<button class="${ativo}" data-tag="${tag}">${tag} (${count})</button>`;
    });
    filtrosContainer.innerHTML = filtrosHTML;

    filtrosContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            filtrosContainer.querySelectorAll('button').forEach(b => b.classList.remove('filtro-ativo'));
            btn.classList.add('filtro-ativo');
            renderizarCartas();
        });
    });

    if (cartasFiltradas.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('vazio');
        empty.style.display = 'flex';
        empty.querySelector('h2').textContent = 'Nenhuma carta encontrada';
        empty.querySelector('p').textContent = 'Tente ajustar os filtros ou criar uma nova carta.';
        return;
    }

    grid.classList.remove('vazio');

    grid.innerHTML = cartasFiltradas.map(carta => criarMiniaturaHTML(carta)).join('');

    grid.querySelectorAll('.carta-miniatura').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            if (id) abrirModalVisualizacao(id);
        });
    });
};

const renderizarFavoritos = () => {
    const grid = document.getElementById('grid-favoritos');
    const empty = document.getElementById('empty-favoritos');
    const buscaInput = document.getElementById('busca-favoritos');

    if (!grid) return;

    let cartas = obterCartas();
    let favoritas = cartas.filter(c => c.favorito);

    const termoBusca = buscaInput?.value?.toLowerCase()?.trim() || '';
    if (termoBusca) {
        favoritas = favoritas.filter(c =>
            c.nome.toLowerCase().includes(termoBusca) ||
            c.tipo.toLowerCase().includes(termoBusca) ||
            c.descricao.toLowerCase().includes(termoBusca) ||
            (c.tags && c.tags.some(t => t.toLowerCase().includes(termoBusca)))
        );
    }

    if (favoritas.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('vazio');
        empty.style.display = 'flex';
        empty.querySelector('h2').textContent = 'Nenhuma carta favoritada';
        empty.querySelector('p').textContent = 'Explore suas cartas e favorite as que você mais gosta!';
        return;
    }

    empty.style.display = 'none';
    grid.classList.remove('vazio');

    grid.innerHTML = favoritas.map(carta => criarMiniaturaHTML(carta)).join('');

    grid.querySelectorAll('.carta-miniatura').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            if (id) abrirModalVisualizacao(id);
        });
    });
};

const configurarValidacaoFormulario = () => {
    const form = document.getElementById("form-carta");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let valido = true;
        const camposObrigatorios = form.querySelectorAll("[required]");
        camposObrigatorios.forEach(campo => {
            campo.classList.remove("erro");
            if (!campo.value.trim()) {
                campo.classList.add("erro");
                valido = false;
            }
        });

        const tipoSelecionado = document.querySelector('.grade-tipos input[type="radio"]:checked');
        if (!tipoSelecionado) {
            valido = false;
            document.getElementById('grade-tipos').style.border = "2px solid #e74c3c";
            document.getElementById('grade-tipos').style.borderRadius = "8px";
            document.getElementById('grade-tipos').style.padding = "8px";
        } else {
            document.getElementById('grade-tipos').style.border = "none";
            document.getElementById('grade-tipos').style.padding = "0";
        }

        const raridadeSelecionada = form.querySelector('input[name="raridade"]:checked');
        if (!raridadeSelecionada) {
            valido = false;
            const grupoRaridade = form.querySelector(".opcoes-raridade");
            grupoRaridade.style.border = "2px solid #e74c3c";
            grupoRaridade.style.borderRadius = "6px";
            grupoRaridade.style.padding = "8px";
        } else {
            const grupoRaridade = form.querySelector(".opcoes-raridade");
            grupoRaridade.style.border = "none";
            grupoRaridade.style.padding = "0";
        }

        if (!valido) {
            alert("Preencha todos os campos obrigatórios (*) corretamente.");
            return;
        }

        const dados = {
            nome: document.getElementById('nome-carta').value.trim(),
            tipo: tipoSelecionado.value,
            descricao: document.getElementById('descricao-carta').value.trim(),
            custo: parseInt(document.querySelector('.valor-atributo[data-atributo="custo"]').textContent) || 0,
            atk: parseInt(document.querySelector('.valor-atributo[data-atributo="atk"]').textContent) || 0,
            vida: parseInt(document.querySelector('.valor-atributo[data-atributo="vida"]').textContent) || 0,
            def: parseInt(document.querySelector('.valor-atributo[data-atributo="def"]').textContent) || 0,
            raridade: document.querySelector('input[name="raridade"]:checked')?.value || 'Comum',
            imagem: document.getElementById('imagem-base64')?.value || '',
            tags: Array.from(document.querySelectorAll('.area-tags .tag-item:not(.btn-adicionar-tag)'))
                .map(el => el.textContent.replace('×', '').trim()),
            favorito: false,
            corFundo: document.getElementById('cor-fundo')?.value || '#cca43b',
            corBorda: document.getElementById('cor-borda')?.value || '#cca43b',
            corCorpo: document.getElementById('cor-corpo')?.value || '#151518'
        };

        let cartas = obterCartas();
        const novaCarta = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            ...dados,
            criadoEm: Date.now()
        };
        cartas.unshift(novaCarta);
        salvarCartas(cartas);
        alert(' Carta salva com sucesso!');
        form.reset();
        document.querySelector('.valor-atributo[data-atributo="custo"]').textContent = '0';
        document.querySelector('.valor-atributo[data-atributo="atk"]').textContent = '0';
        document.querySelector('.valor-atributo[data-atributo="vida"]').textContent = '0';
        document.querySelector('.valor-atributo[data-atributo="def"]').textContent = '0';
        document.getElementById('imagem-base64').value = '';
        document.querySelector('.area-upload .mensagem-upload')?.remove();
        document.querySelectorAll('.area-tags .tag-item').forEach(el => el.remove());
        document.querySelector('.contador-palavras').textContent = '0/120 palavras';
        const btnAdicionar = document.querySelector('.btn-adicionar-tag');
        if (btnAdicionar) btnAdicionar.style.display = 'flex';
        const inputNovaTag = document.querySelector('.input-nova-tag');
        if (inputNovaTag) {
            inputNovaTag.style.display = 'none';
            inputNovaTag.value = '';
        }
        const primeiroRadio = document.querySelector('.grade-tipos input[type="radio"]');
        if (primeiroRadio) {
            primeiroRadio.checked = true;
            document.querySelectorAll('.grade-tipos .opcao-tipo').forEach(el => el.classList.remove('selecionado'));
            primeiroRadio.closest('.opcao-tipo')?.classList.add('selecionado');
        }
        const corFundoInput = document.getElementById('cor-fundo');
        const corBordaInput = document.getElementById('cor-borda');
        const corCorpoInput = document.getElementById('cor-corpo');
        if (corFundoInput) corFundoInput.value = '#cca43b';
        if (corBordaInput) corBordaInput.value = '#cca43b';
        if (corCorpoInput) corCorpoInput.value = '#151518';
        atualizarPreview();
        if (document.getElementById('cartas').style.display !== 'none') {
            renderizarCartas();
        }
        renderizarColecoes();
    });

    form.querySelectorAll("input, select, textarea").forEach(campo => {
        campo.addEventListener("input", () => {
            campo.classList.remove("erro");
            if (campo.id === 'nome-carta' || campo.id === 'descricao-carta' ||
                campo.id === 'cor-fundo' || campo.id === 'cor-borda' || campo.id === 'cor-corpo') {
                atualizarPreview();
            }
        });
        campo.addEventListener("change", () => {
            campo.classList.remove("erro");
            if (campo.id === 'cor-fundo' || campo.id === 'cor-borda' || campo.id === 'cor-corpo') {
                atualizarPreview();
            }
        });
    });

    document.querySelectorAll('input[name="raridade"]').forEach(radio => {
        radio.addEventListener('change', atualizarPreview);
    });
};

const configurarAcessibilidade = () => {
    const { interruptorModo } = elementos;
    if (!interruptorModo) return;
    interruptorModo.setAttribute("tabindex", "0");
    interruptorModo.setAttribute("role", "switch");
    interruptorModo.setAttribute("aria-label", "Alternar modo claro/escuro");
    interruptorModo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            interruptorModo.click();
        }
    });
};

const configurarBotoesNavegacao = () => {
    const botaoIrCriar = document.getElementById("botao-ir-criar");
    if (botaoIrCriar) {
        botaoIrCriar.addEventListener("click", () => {
            navegarPara("criacao");
        });
    }
    const botaoIrCartas = document.getElementById("botao-ir-cartas");
    if (botaoIrCartas) {
        botaoIrCartas.addEventListener("click", () => {
            navegarPara("cartas");
        });
    }
};

const configurarSalvarPNG = () => {
    const btn = document.getElementById('btn-salvar-png');
    if (btn) {
        btn.addEventListener('click', salvarPreviewComoPNG);
    }
};

const configurarCancelar = () => {
    const btnCancelar = document.querySelector('.btn-cancelar');
    if (!btnCancelar) return;
    btnCancelar.addEventListener('click', function(e) {
        e.preventDefault();
        const form = document.getElementById('form-carta');
        if (form) form.reset();
        document.querySelector('.valor-atributo[data-atributo="custo"]').textContent = '0';
        document.querySelector('.valor-atributo[data-atributo="atk"]').textContent = '0';
        document.querySelector('.valor-atributo[data-atributo="vida"]').textContent = '0';
        document.querySelector('.valor-atributo[data-atributo="def"]').textContent = '0';
        document.getElementById('imagem-base64').value = '';
        document.querySelector('.area-upload .mensagem-upload')?.remove();
        document.querySelectorAll('.area-tags .tag-item').forEach(el => el.remove());
        document.querySelector('.contador-palavras').textContent = '0/120 palavras';
        const btnAdicionar = document.querySelector('.btn-adicionar-tag');
        if (btnAdicionar) btnAdicionar.style.display = 'flex';
        const inputNovaTag = document.querySelector('.input-nova-tag');
        if (inputNovaTag) {
            inputNovaTag.style.display = 'none';
            inputNovaTag.value = '';
        }
        const primeiroRadio = document.querySelector('.grade-tipos input[type="radio"]');
        if (primeiroRadio) {
            primeiroRadio.checked = true;
            document.querySelectorAll('.grade-tipos .opcao-tipo').forEach(el => el.classList.remove('selecionado'));
            primeiroRadio.closest('.opcao-tipo')?.classList.add('selecionado');
        }
        document.getElementById('cor-fundo').value = '#cca43b';
        document.getElementById('cor-borda').value = '#cca43b';
        document.getElementById('cor-corpo').value = '#151518';
        atualizarPreview();
        navegarPara('cartas');
    });
};

const inicializarEventos = () => {
    elementos.alternar?.addEventListener("click", alternarBarraLateral);
    elementos.interruptorModo?.addEventListener("click", alternarTema);
    elementos.linksBarraLateral.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if (target) {
                navegarPara(target);
            }
        });
    });
    elementos.linksBarraLateral.forEach(link => {
        link.querySelector("a")?.addEventListener("click", criarOnda);
    });
};

const inicializar = () => {
    carregarTema();
    inicializarEventos();
    configurarAcessibilidade();
    configurarContadorPalavras();
    configurarControlesAtributos();
    configurarTags();
    configurarUploadImagem();
    popularGradeTipos();
    configurarValidacaoFormulario();
    configurarBotoesNavegacao();
    configurarModalColecao();
    configurarEventosListaCartas();
    configurarModalVisualizacao();
    configurarSalvarPNG();
    configurarCancelar();
    document.getElementById('salvar-nome-colecao')?.addEventListener('click', renomearColecao);
    document.getElementById('excluir-colecao-detalhe')?.addEventListener('click', excluirColecaoDoModal);
    document.getElementById('fechar-modal-detalhe')?.addEventListener('click', fecharDetalhesColecao);
    document.getElementById('fechar-modal-detalhe-footer')?.addEventListener('click', fecharDetalhesColecao);
    document.getElementById('adicionar-cartas-colecao')?.addEventListener('click', abrirModalAdicionarCartas);

    renderizarCartas();
    renderizarColecoes();
};

document.addEventListener("DOMContentLoaded", inicializar);
