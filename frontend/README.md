# Frontend - PontoMais Bot Web

Interface web moderna construída com React para o PontoMais Bot.

## 🚀 Tecnologias

- React 18
- Vite
- TailwindCSS
- React Router v6
- Axios
- React Icons
- React Toastify

## 📦 Instalação

```bash
npm install
```

## ▶️ Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🏗️ Build

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

## 👀 Preview

```bash
npm run preview
```

## 📁 Estrutura

```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── services/       # Serviços e APIs
├── App.jsx         # Componente raiz
├── main.jsx        # Entry point
└── index.css       # Estilos globais
```

## 🎨 Componentes

### Layout
- Sidebar responsiva
- Menu de navegação
- Header

### Páginas
- **Dashboard**: Visão geral
- **Reports**: Download de relatórios
- **Columns**: Configuração de colunas
- **Settings**: Configurações gerais
- **Rescisao**: Processo de rescisão

## 🔌 API

O frontend se comunica com o backend via Axios.

Configuração em `src/services/api.js`

## 🎨 Estilização

TailwindCSS para estilização utilitária.

Configuração em `tailwind.config.js`

## 📱 Responsividade

- Mobile first
- Breakpoints: sm, md, lg, xl
- Sidebar colapsável em mobile

## 🔧 Configuração

### Variáveis de Ambiente

Crie `.env` baseado em `.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

### Proxy

Configurado em `vite.config.js` para desenvolvimento:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

## 📝 Scripts

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build

## 🐛 Debug

### React DevTools
Instale a extensão React DevTools no navegador

### Console
Use `console.log()` para debug

### Network
Verifique requisições na aba Network do DevTools

## 📚 Documentação

Consulte a documentação principal no README.md da raiz do projeto.
