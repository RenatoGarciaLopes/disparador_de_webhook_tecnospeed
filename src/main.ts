import express, {
  type Request,
  type Response,
  type Application,
} from "express";

// Cria a instância do Express (bootstrap)
const app: Application = express();

// Middleware para parse de JSON
app.use(express.json());

// Rotas
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express + TypeScript!");
});

app.get("/api/saudacao/:nome", (req: Request, res: Response) => {
  const { nome } = req.params;
  res.json({ mensagem: `Olá, ${nome}!` });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
