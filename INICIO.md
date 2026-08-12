# Portal Gadget Apps — Guia do zero

Este projeto é o **site da Gadget Apps Technology**:

1. Área **pública** (empresa + links para produtos como Angel's Care)
2. Área **logada** (intranet de colaboradores)
3. Módulo **BKF** (backoffice) dentro da intranet

Não é o app Angel's Care e não substitui o site oficial do produto.

---

## Pasta oficial

`C:\GadgetApps\gadgetapps_portal`

Pastas antigas (`gadgetapps_bkf`, `gadgetapps-backoffice`, …) podem ser apagadas depois.

---

## Custo ZERO

Leia **[CUSTOS-ZERO.md](./CUSTOS-ZERO.md)**.

Hospedagem no Firebase = **Hosting estático no Spark (gratuito)**.  
Sem Blaze. Sem Functions neste portal. Guia: **[DEPLOY-FIREBASE.md](./DEPLOY-FIREBASE.md)**.

---

## Passo 1 — Abrir no Cursor

1. **File → Open Folder**
2. `C:\GadgetApps\gadgetapps_portal`

---

## Passo 2 — Ver no computador

```bash
cd C:\GadgetApps\gadgetapps_portal
npm install
npm run dev
```

Chrome: **http://localhost:3000**

Fluxo para testar:

1. Home → ver produtos  
2. Angel's Care → “Site oficial” (abre o site do app)  
3. Área colaborador → login demo (qualquer e-mail/senha)  
4. Intranet → Backoffice (BKF) → Angel's Care  

---

## Passo 3 — Publicar no Firebase (quando quiser)

Só Hosting gratuito. Siga **DEPLOY-FIREBASE.md**.

Ainda **não** criamos o projeto Firebase por você (precisa da sua conta Google no console).

---

## Mapa mental

```
Site Gadget Apps (este projeto)
├── Público → produtos → site oficial Angel's Care (outro projeto)
└── Login → Intranet → BKF → operar apps
```
