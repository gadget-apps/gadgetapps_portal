# Gadget Apps Technology — Portal

Site institucional + intranet de colaboradores. O **BKF (backoffice)** é um módulo da intranet, não o site inteiro.

## Pasta oficial

`C:\GadgetApps\gadgetapps_portal`

(Ignore pastas antigas `gadgetapps_bkf`, `gadgetapps-backoffice`, etc.)

## Custo zero

Leia [CUSTOS-ZERO.md](./CUSTOS-ZERO.md) e [DEPLOY-FIREBASE.md](./DEPLOY-FIREBASE.md).

Hospedagem: **Firebase Hosting** com site **estático** (plano Spark gratuito). Sem Cloud Functions / sem Blaze.

## Ligar no PC

```bash
cd C:\GadgetApps\gadgetapps_portal
npm install
npm run dev
```

Abra http://localhost:3000

## Mapa do site

| URL | O quê |
|-----|--------|
| `/` | Home pública Gadget Apps |
| `/produtos/` | Catálogo público |
| `/produtos/angels-care/` | Página do Angel's Care + link ao site oficial |
| `/login/` | Entrada colaborador (demo local por enquanto) |
| `/intranet/` | Hub interno |
| `/intranet/bkf/` | Backoffice multi-app |

## Começar

Guia leigo: [INICIO.md](./INICIO.md)
