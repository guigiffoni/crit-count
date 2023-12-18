
/**
`CREATE TABLE criticos (
    datahora DEFAULT CURRENT_TIMESTAMP,
    tipo_critico INTEGER NOT NULL,
    sistema DEFAULT 'D&D5e',
    jogador NOT NULL
)` */

import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { serveFile } from "https://deno.land/std@0.194.0/http/file_server.ts";

const db = new DB("test.db");

function handler(req: Request): Response {

    let query;
    const route = new URL(req.url).pathname;

    if (route == '/') return serveFile(req, './front-end/index.html')
    if (route == '/style.css') return serveFile(req, './front-end/style.css')
    if (route == '/script.js') return serveFile(req, './front-end/script.js')

    if (route.startsWith('/criticos')) {
        if (req.method == 'GET') {
            query = db.queryEntries(
                `SELECT
                    DATETIME(datahora, '-3 hours') AS datahora,
                    CASE WHEN tipo_critico = 0 THEN 'Erro' ELSE 'Acerto' END tipo_critico,
                    sistema,
                    jogador
                FROM criticos 
                ORDER BY datahora DESC`
            )
        }

        if (req.method == 'POST') {
            req.json()
            .then(dados => {
                if (Object.values(dados).every(value => !!value == true)) {
                    query = db.queryEntries(
                        `INSERT INTO criticos (tipo_critico, sistema, jogador) VALUES (?, ?, ?)`, 
                        [ dados.tipo_critico, dados.sistema, dados.jogador ]
                    )
                } else {
                    console.warn('dados insuficientes');
                }
            })
        }
    }

    if (route.startsWith('/ranking')) {
        if (req.method == 'GET') {
            query = db.queryEntries(
                `SELECT 
                    jogador, 
                    COUNT(CASE WHEN tipo_critico = 0 THEN 'Erro' END) AS erros,
                    COUNT(CASE WHEN tipo_critico = 1 THEN 'Acerto' END) AS acertos,
                    COUNT(tipo_critico) AS total
                FROM criticos
                GROUP BY jogador
                ORDER BY acertos DESC`
            )
        }
    }

    if (route.startsWith('/jogadores')) {
        if (req.method == 'GET') {
            query = db.queryEntries('SELECT jogador FROM criticos GROUP BY jogador');   
        }
    }
    
    return new Response(JSON.stringify(query || ''), {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    });
}

Deno.serve({ port: 80 }, handler);
