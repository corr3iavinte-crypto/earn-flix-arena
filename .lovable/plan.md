## Objetivo
Adicionar o número 842004299 (Marcos) como administrador do sistema NETFILMES.

## Situação atual
- O utilizador Marcos já existe na base de dados (perfil com telefone 842004299)
- Atualmente possui apenas o role 'user'
- Não tem role 'admin'

## Passo
1. Inserir um novo registo na tabela `user_roles` com:
   - user_id: 8629124c-a6c0-4a1a-b6ef-7ff98bae0c46
   - role: admin

Após esta alteração, o utilizador terá acesso ao Painel Admin e poderá gerir depósitos, saques, planos e saldos.