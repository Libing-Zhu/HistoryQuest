#!/bin/zsh
cd "${0:A:h}"
if command -v node >/dev/null 2>&1 && node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1);require('node:sqlite')" >/dev/null 2>&1; then
  node "启动网页.cjs"
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" "启动网页.cjs"
else
  echo '请先安装支持node:sqlite的Node.js 24 LTS，再双击此文件。'
  read -k 1
fi
