
const $ = (CSSSelector) => document.querySelector(CSSSelector);
const $$ = (CSSSelector) => document.querySelectorAll(CSSSelector);
const urlBase = '';

class TabelaCabulosa extends HTMLTableElement {

    constructor() {
        super();

        this.dados = [];
        this.pagina = 1;
    }

    requestDados() {
        return fetch(urlBase + this.dataset.endpoint).then(response => response.json())
    }

    render() {
        const intervalo = this.dados.slice((this.pagina - 1) * this.tamanhoPagina, this.pagina * this.tamanhoPagina);

        this.querySelector('tbody').innerHTML = intervalo.reduce((pre, cur) => {
            let string = '<tr>';

            for (const coluna of this.colunas) {
                string += `<td>${cur[coluna]}</td>`
            }

            return pre + string + '</tr>';
        }, '')

        if (this.querySelector('.page-info')) {
            this.paginas = Math.ceil(this.dados.length / this.tamanhoPagina);
            this.querySelector('.page-info').innerHTML = `${this.pagina} / ${this.paginas}`
        }
    }

    async refresh() {
        this.dados = await this.requestDados();

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
        
        this.dados = this.dados.sort((a, b) => {
            if (thead.dataset.ordem == 'desc')
                [a, b] = [b, a];

            if ([a[th.dataset.chave], b[th.dataset.chave]].every(item => !isNaN(item)))
                return a[th.dataset.chave] - b[th.dataset.chave]
            else
                return a[th.dataset.chave].localeCompare(b[th.dataset.chave])
        })

        this.render();
    }

    mudarPagina(passo) {
        const novaPagina = this.pagina + parseInt(passo);

        if (novaPagina < 1 || novaPagina > this.paginas)
            return

        this.pagina = novaPagina;
        this.render();
    }

    connectedCallback() {
        const headers = this.querySelectorAll('th[data-chave]');
        this.colunas = [...headers].map(th => th.dataset.chave);
        this.tamanhoPagina = parseInt(this.dataset.pageSize) || Infinity;

        headers.forEach(header => header.addEventListener('click', this.ordernar.bind(this)));
        this.querySelectorAll('tfoot button[data-passo]').forEach(button => 
            button.addEventListener('click', evt => this.mudarPagina(evt.target.dataset.passo))
        )
        
        this.refresh();
    }
}

customElements.define('tabela-cabulosa', TabelaCabulosa, { extends: 'table' });

$('#jogador').addEventListener('keydown', evt => {
    const { key, target } = evt;

    if (['Enter', 'Tab'].includes(key)) {
        const nomes = [...$('#jogador-list').options].map(item => item.innerHTML);

        const match = nomes.filter(nome => nome.toLowerCase().includes(target.value.toLowerCase()));
        target.value = match.length == 1 ? match[0] : target.value;
    }
})

$('#addCritico').addEventListener('click', async evt => {
    const objBase = {};
    formulario = evt.target.closest('fieldset').querySelectorAll('[name]');
    
    for (const campo of formulario) {
        objBase[campo.id] = campo.value;
    }

    await fetch(urlBase + '/criticos', {
        method: 'POST',
        headers: { "Content-Type": 'application/json' },
        body: JSON.stringify(objBase),
    })

    $('#jogador').value = '';
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