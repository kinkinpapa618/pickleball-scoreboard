# Dev aliases
alias devkill='pkill -9 -f "tsx server/index.ts" && sleep 1'
alias dev='devkill && npm run dev &'
