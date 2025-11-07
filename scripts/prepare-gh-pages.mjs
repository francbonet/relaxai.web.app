import { promises as fs } from 'fs';
import { join } from 'path';

const outDir = process.env.GH_OUT_DIR || 'build';

async function main() {
  // Asegúrate de que ya has hecho el build y el patch del index
  // Tu "build:web" ya llama a patch-index.mjs
  const index = join(outDir, 'index.html');
  const notFound = join(outDir, '404.html');

  // Copia index -> 404 para que funcionen rutas de SPA en GitHub Pages
  const html = await fs.readFile(index, 'utf8');
  await fs.writeFile(notFound, html, 'utf8');

  // Evita que Jekyll oculte archivos que empiecen por _
  await fs.writeFile(join(outDir, '.nojekyll'), '', 'utf8');

  // Opcional: imprime un pequeño resumen
  console.log(`[prepare-gh-pages] 404.html y .nojekyll generados en ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
