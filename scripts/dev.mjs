import {spawn} from 'node:child_process';
const args=process.argv.slice(2).map(a=>a==='--host'?'--ip':a);
const proc=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev',...args],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>proc.kill(sig));
proc.on('exit',code=>process.exit(code??1));
