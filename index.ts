import { Database } from "bun:sqlite";

const database = new Database("test.db");

type sqliteParams = (string[] | number[] | boolean[]);

function jsonQuery(query: string, params?: sqliteParams): string {
    if (params === undefined)
        return JSON.stringify(database.query(query).all());
    else
        return JSON.stringify(database.query(query).all(...params));
}

function responseQuery(query: string, bindings?: string[]): Response {
    return new Response(jsonQuery(query, bindings));
}

Bun.serve({
    async fetch(req): Promise<any> {
        let { pathname } = new URL(req.url);
        pathname = pathname == '/' ? 'index.html' : pathname.slice(1);

        if (pathname.match(/\.\w+/) && Bun.file(`./front-end/${pathname}`).size > 0) {
            return new Response(Bun.file(`./front-end/${pathname}`));
        }

        switch(pathname) {
            case 'criticos':
                if (req.method == 'GET') {
                    return responseQuery(
                        `SELECT 
                            DATETIME(datahora, '-3 hour') AS datahora, 
                            CASE WHEN tipo_critico = 0 THEN 'Erro' ELSE 'Acerto' END AS critico,
                            jogador,
                            sistema
                        FROM criticos
                        ORDER BY datahora DESC`
                    );
                }

                if (req.method == 'POST') {
                    const { jogador, sistema, tipo_critico } = await req.json();

                    console.log(database.query(
                        `INSERT INTO criticos (
                            jogador, sistema, tipo_critico
                        ) VALUES (
                            ?, ?, ?
                        )`
                    ).all(jogador, sistema, tipo_critico));

                    return new Response('crítico inserido!');
                }

                break;
            case 'ranking':
                if (req.method == 'GET') {
                    return responseQuery(
                        `SELECT 
                            jogador, 
                            COUNT(CASE WHEN tipo_critico = 0 THEN 1 END) AS erros,
                            COUNT(CASE WHEN tipo_critico = 1 THEN 1 END) AS acertos,
                            COUNT(*) AS total
                        FROM criticos
                        GROUP BY jogador
                        ORDER BY acertos DESC`
                    );
                }

                break;
            case 'jogadores':
                if (req.method == 'GET') {
                    return responseQuery(`SELECT jogador FROM criticos GROUP BY jogador`);
                }

                break;
            default:
                return new Response(undefined, { status: 404, statusText: "vish..." });
        }
    },
    port: 80,
})
