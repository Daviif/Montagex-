# Assets

Esta pasta contém os recursos estáticos do app.

## Imagens Necessárias

Para gerar os assets do Expo, você pode usar o seguinte comando:

```bash
npx expo-asset
```

Ou criar manualmente:

- **icon.png** - 1024x1024 (ícone do app)
- **splash.png** - 1284x2778 (tela de splash)
- **adaptive-icon.png** - 1024x1024 (ícone adaptativo Android)
- **favicon.png** - 48x48 (favicon web)

## Gerando Assets Automaticamente

O Expo pode gerar automaticamente os assets nas resoluções corretas:

1. Crie um arquivo `icon.png` (1024x1024) nesta pasta
2. Crie um arquivo `splash.png` nesta pasta
3. Execute `npx expo prebuild`

## Placeholder

Por enquanto, você pode usar cores sólidas ou baixar logos da web até criar os assets definitivos.

### Online Tools

- **Icon Generator:** https://www.appicon.co/
- **Splash Generator:** https://apetools.webprofusion.com/app/#/tools/imagegorilla
