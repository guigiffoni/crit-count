## Crit Count

Contador de crítico simples acessível através do navegador, acompanha tabelas com controle customizado de página, ordenação e formulário de registro de críticos; nenhuma biblioteca ou framework é utilizado no front-end para mantê-lo o mais leve o possível.

### Como rodar
O contador pode ser operador a partir do navegador, o arquivo ```host-api.ts``` contém o código para hostear os arquivos e a API.

[instale a última versão do Deno](https://docs.deno.com/runtime/manual/getting_started/installation) e execute o comando:
~~~
deno run --allow-all host-api.ts
~~~
e abra o navegador no endereço:
~~~
http://localhost
~~~
