import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("A porta definida em PORT deve estar entre 1 e 65535.");
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Método não permitido.");
    return;
  }

  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(root, `.${requestedPath}`);
  const pathFromRoot = relative(root, filePath);
  if (
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    response.writeHead(404);
    response.end("Arquivo não encontrado.");
    return;
  }

  let contents;
  try {
    contents = await readFile(filePath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Arquivo não encontrado.");
      return;
    }
    console.error("Falha ao ler o arquivo solicitado:", error);
    response.writeHead(500);
    response.end("Erro ao carregar o arquivo.");
    return;
  }

  response.writeHead(200, {
    "Content-Length": contents.byteLength,
    "Content-Type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(request.method === "HEAD" ? undefined : contents);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Nin-Gari disponível em http://127.0.0.1:${port}`);
});
