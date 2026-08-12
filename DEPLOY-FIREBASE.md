# Deploy no Firebase Hosting (custo ZERO)

O portal é exportado como site **estático** (`out/`).
No plano **Spark (gratuito)** o Hosting não exige Blaze nem Functions.

## O que NÃO fazer

- Não ativar Blaze
- Não adicionar Cloud Functions neste projeto
- Não ligar Gemini / APIs pagas

## Passo a passo (uma vez)

### 1. Criar projeto Firebase gratuito

1. Abra https://console.firebase.google.com
2. **Adicionar projeto** (ou usar um já seu **só** do portal — não misture com `app-angelscare` se puder evitar)
3. Nome sugerido: `gadgetapps-portal`
4. Desligue Analytics se quiser (opcional)
5. Confirme que o plano é **Spark / gratuito**

### 2. Ativar só o Hosting

1. No menu: **Build → Hosting → Começar**
2. Não precisa de Functions

### 3. Ajustar o ID no código

No arquivo `.firebaserc`, o ID deve ser **igual** ao do console:

```json
{
  "projects": {
    "default": "gadgetapps-portal"
  }
}
```

(Troque se o ID real for outro.)

### 4. Login e deploy (no PC)

```bash
cd C:\GadgetApps\gadgetapps_portal
firebase login
npm run build
firebase deploy --only hosting
```

Ao terminar, o Firebase mostra a URL (algo como `https://gadgetapps-portal.web.app`).

## Comandos do dia a dia

```bash
npm run build          # gera a pasta out/
firebase deploy --only hosting
```

## Cotas free (ordem de grandeza)

Hosting no Spark costuma bastar para site institucional + poucos colaboradores.
Se no futuro o tráfego explodir, paramos e avaliamos — sem surpresa de fatura.
