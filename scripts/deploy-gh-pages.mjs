import ghpages from 'gh-pages';

const outDir = process.env.GH_OUT_DIR || 'build';

// Puedes setear GH_BRANCH, GH_REPO y GH_USER/EMAIL vía entorno si quieres
const branch = process.env.GH_BRANCH || 'gh-pages';
const repo = process.env.GH_REPO; // p.ej: https://github.com/usuario/tu-repo.git

ghpages.publish(
  outDir,
  {
    branch,
    repo,                 // si no lo pones, usa "origin"
    dotfiles: true,       // publica .nojekyll
    message: process.env.GH_COMMIT_MSG || 'deploy: GitHub Pages',
    silent: false,
    user: (process.env.GH_USER && process.env.GH_EMAIL)
      ? { name: process.env.GH_USER, email: process.env.GH_EMAIL }
      : undefined,
  },
  function (err) {
    if (err) {
      console.error('[deploy-gh-pages] Error:', err);
      process.exit(1);
    } else {
      console.log(`[deploy-gh-pages] Publicado ${outDir} en la rama ${branch}`);
    }
  }
);
