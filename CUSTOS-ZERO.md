# Política de custo ZERO

Este portal **não pode gerar custo financeiro**.
Tudo deve caber no **plano gratuito** (Firebase Spark) ou rodar **só no seu PC**.

---

## O que já está ok (R$ 0)

| Coisa | Por quê |
|-------|---------|
| Código em `gadgetapps_portal` | Só arquivos no PC |
| `npm run dev` / localhost | Sem nuvem |
| Export estático (`out/`) | Arquivos HTML/JS/CSS |
| Firebase **Hosting** no Spark | Cotas free para site estático |
| Login demo no navegador | Sem Auth na nuvem ainda |

---

## Regras obrigatórias

1. **Não ativar Blaze** sem autorização explícita.
2. **Não criar Cloud Functions** neste portal (exigem Blaze).
3. **Não ligar Gemini / Maps / APIs pagas**.
4. Deploy = **somente** `firebase deploy --only hosting`.
5. Projeto Firebase do portal **separado** do Angel's Care quando possível.
6. Dados do Angel's Care: ler o mínimo; sem espelhar banco inteiro.

---

## Firebase permitido neste momento

| Serviço | Pode? |
|---------|--------|
| Hosting (Spark) | Sim |
| Auth (Spark) — depois | Sim, client-side |
| Firestore pequeno (Spark) — depois | Sim, com cuidado de cota |
| Cloud Functions | Não |
| Blaze | Não |

---

## Resumo

> PC para desenvolver.  
> Hosting estático gratuito para publicar.  
> Nada de Blaze / Functions / IA paga sem você autorizar.
