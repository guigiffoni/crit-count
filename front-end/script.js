
const $ = (CSSSelector) => document.querySelector(CSSSelector);
const $$ = (CSSSelector) => document.querySelectorAll(CSSSelector);
const urlBase = '';

class TabelaDinamica extends HTMLTableElement {

    constructor() {
        super();

        this.pagina = 1;
        this.dados = [];
        this.dadosFiltrados = [];
    }

    connectedCallback() {
        const headers = this.querySelectorAll('th[data-chave]');
        this.colunas = [...headers].map(th => th.dataset.chave);
        this.tamanhoPagina = parseInt(this.dataset.pageSize) || Infinity;
        this.querySelectorAll('[fullspan]').forEach(elem => 
            elem.setAttribute('colspan', this.colunas.length)
        );

        headers.forEach(header => header.addEventListener('click', this.ordernar.bind(this)));
        
        this.refresh();
    }

    requestDados() {
        return fetch(urlBase + this.dataset.endpoint).then(response => response.json())
    }

    render() {
        const intervalo = this.dadosFiltrados.slice((this.pagina - 1) * this.tamanhoPagina, this.pagina * this.tamanhoPagina);

        this.querySelector('tbody').innerHTML = intervalo.reduce((pre, cur) => {
            let string = '<tr>';

            for (const coluna of this.colunas) {
                string += `<td>${cur[coluna]}</td>`
            }

            return pre + string + '</tr>';
        }, '')

        if (intervalo.length == 0) {
            this.querySelector('tbody').innerHTML = `<td colspan="${this.colunas.length}">Nada encontrado</td>`
        }

        this.dispatchEvent(new CustomEvent('render', {
            detail: {
                registros: this.dadosFiltrados.length
            } 
        }))
    }

    async refresh() {
        this.dados = await this.requestDados();
        this.dadosFiltrados = this.dados;

        this.render();
    }

    ordernar(evt) {
        const thead = evt.target.closest('thead');
        const th = evt.target.closest('th');
        
        switch(thead.dataset.ordem) {
            case 'desc':
                thead.dataset.ordem = 'asc';
                break;
            case 'asc':
                thead.dataset.ordem = 'desc';
                break;
            default:
                thead.dataset.ordem = 'desc';
                break;
        }
        
        this.dadosFiltrados = this.dadosFiltrados.sort((a, b) => {
            if (thead.dataset.ordem == 'desc')
                [a, b] = [b, a];

            if ([a[th.dataset.chave], b[th.dataset.chave]].every(item => !isNaN(item)))
                return a[th.dataset.chave] - b[th.dataset.chave]
            else
                return a[th.dataset.chave].localeCompare(b[th.dataset.chave])
        })

        this.render();
    }
}

class PesquisaTabela extends HTMLInputElement {
    connectedCallback() {
        const objToString = (objeto) => Object.values(objeto).join('').toLowerCase();
        const tabela = this.closest('table[is="dynamic-table"]');
        let termoAnterior = '';

        this.addEventListener('keyup', evt => {
            const termo = evt.target.value.toLowerCase();

            if (termo != termoAnterior) {
                tabela.dadosFiltrados = tabela.dados.filter(registro => objToString(registro).includes(termo));
            }

            termoAnterior = termo;
            tabela.render();
        })
    }
}

class ControleDePagina extends HTMLTableCellElement {
    connectedCallback() {
        const tabela = this.closest('table[is="dynamic-table"]');
        const buttons = [0,0,0,0,0].map(() => document.createElement('button'));
        const [botaoPrimeira, botaoAnterior, paginaAtual, botaoProxima, botaoUltima] = buttons;

        botaoPrimeira.innerHTML = 'Primeira';
        botaoAnterior.innerHTML = 'Anterior';
        botaoProxima.innerHTML = 'Próxima';
        botaoUltima.innerHTML = 'Última';
        
        buttons.forEach((button, index) => {            
            button.addEventListener('click', () => {
                switch(index) {
                    // primeira página
                    case 0:
                        tabela.pagina = 1;
                        break;
                    // página anterior
                    case 1:
                        tabela.pagina -= 1;
                        break;
                    // próxima página
                    case 3:
                        tabela.pagina += 1;
                        break;
                    // última página
                    case 4:
                        tabela.pagina = this.ultimaPagina;
                        break;
                }
                
                tabela.render();
            })

            this.append(button);
        })

        tabela.addEventListener('render', evt => {
            this.ultimaPagina = Math.ceil(evt.detail.registros / tabela.tamanhoPagina) || 1;
            paginaAtual.innerHTML = `${tabela.pagina} / ${this.ultimaPagina}`;

            // reset no atributo disabled dos botões
            buttons.forEach(button => button.disabled = false);

            if (tabela.pagina == 1) {
                botaoPrimeira.disabled = true;
                botaoAnterior.disabled = true; 
            }

            if (tabela.pagina == this.ultimaPagina) {
                botaoProxima.disabled = true;
                botaoUltima.disabled = true;
            }
        })
    }
}

customElements.define('dynamic-table', TabelaDinamica, { extends: 'table' });
customElements.define('table-search', PesquisaTabela, { extends: 'input' });
customElements.define('table-pager', ControleDePagina, { extends: 'td' });

// Event listeners do formulário de adicionar os críticos
$('#jogador').addEventListener('keydown', evt => {
    const { key, target } = evt;

    if (['Enter', 'Tab'].includes(key)) {
        const nomes = [...$('#jogador-list').options].map(item => item.innerHTML);

        const match = nomes.filter(nome => nome.toLowerCase().includes(target.value.toLowerCase()));
        target.value = match.length == 1 ? match[0] : target.value;
    }
})

$('#addCritico').addEventListener('click', async () => {
    const critico = {
        'sistema': $('#sistema').value,
        'tipo_critico': $('.tipo_critico input:checked').value,
        'jogador': $('#jogador').value
    };

    await fetch(urlBase + '/criticos', {
        method: 'POST',
        headers: { "Content-Type": 'application/json' },
        body: JSON.stringify(critico),
    })

    $('#jogador').value = '';
    $$('input[name="critico"]').forEach(input => input.checked = false);
    $$('table').forEach(table => table.refresh());

    recarregarListaDeJogadores();
})

function recarregarListaDeJogadores() {
    fetch(urlBase + '/jogadores')
    .then(response => response.json())
    .then(response => $('#jogador-list').innerHTML = response.reduce((pre, cur) => {
        return pre + `<option value="${cur.jogador}">${cur.jogador}</option>`
    }, ''))
}

recarregarListaDeJogadores();