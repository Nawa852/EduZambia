import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, RotateCcw, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Line { type: 'in' | 'out' | 'err' | 'sys'; text: string; }

const FILES: Record<string, string> = {
  '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nadmin:x:1000:1000:Admin:/home/admin:/bin/bash\nguest:x:1001:1001:Guest:/home/guest:/bin/bash',
  '/var/log/auth.log': 'Nov 03 02:13:55 host sshd[2541]: Failed password for root from 192.168.1.42 port 50122 ssh2\nNov 03 02:14:02 host sshd[2541]: Failed password for root from 192.168.1.42 port 50122 ssh2\nNov 03 02:14:12 host sshd[2541]: Accepted password for admin from 192.168.1.42 port 50124 ssh2',
  '/home/admin/notes.txt': 'Reminder: rotate API keys monthly\nFlag{w3lc0m3_t0_th3_t3rm1n4l}',
};

const HELP = `Available commands:
  ls [path]            List directory contents
  cat <file>           Show file contents
  whoami               Print current user
  pwd                  Print working directory
  id                   Print user/group ids
  uname -a             System info
  netstat              Show listening ports (sim)
  nmap <host>          Scan host (sim)
  curl <url>           Fetch URL (sim)
  history              Command history
  clear                Clear screen
  help                 Show this help`;

const SCENARIOS = [
  { name: 'Recon basics', goal: 'Discover the user with `whoami`, then list /etc with `ls /etc`.' },
  { name: 'Read the flag', goal: 'Find the hidden flag in /home/admin/notes.txt' },
  { name: 'Investigate breach', goal: 'Inspect /var/log/auth.log to find the attacker IP.' },
];

const CyberTerminalSandboxPage = () => {
  const [lines, setLines] = useState<Line[]>([
    { type: 'sys', text: 'Synapse Cyber Sandbox v1.0 — type `help` to begin.' },
    { type: 'sys', text: 'This is a SAFE simulated terminal. Nothing runs on real systems.' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home/admin');
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const print = (text: string, type: Line['type'] = 'out') =>
    setLines((l) => [...l, { type, text }]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHIdx(-1);
    setLines((l) => [...l, { type: 'in', text: `${cwd} $ ${cmd}` }]);

    const [bin, ...args] = cmd.split(/\s+/);
    switch (bin) {
      case 'help': print(HELP); break;
      case 'clear': setLines([]); break;
      case 'whoami': print('admin'); break;
      case 'pwd': print(cwd); break;
      case 'id': print('uid=1000(admin) gid=1000(admin) groups=1000(admin),27(sudo)'); break;
      case 'uname': print('Linux sandbox 5.15.0 #1 SMP x86_64 GNU/Linux'); break;
      case 'history': print(history.map((h, i) => `${i + 1}  ${h}`).join('\n') || '(empty)'); break;
      case 'ls': {
        const path = args[0] || cwd;
        if (path === '/etc') print('hostname  hosts  passwd  shadow  ssh');
        else if (path === '/home/admin') print('notes.txt  Documents  scripts');
        else if (path === '/var/log') print('auth.log  syslog  kern.log');
        else print('Documents  scripts  notes.txt');
        break;
      }
      case 'cat': {
        const f = args[0];
        if (!f) { print('cat: missing operand', 'err'); break; }
        const path = f.startsWith('/') ? f : `${cwd}/${f}`;
        if (FILES[path]) print(FILES[path]);
        else print(`cat: ${f}: No such file or directory`, 'err');
        break;
      }
      case 'netstat': print('tcp  0.0.0.0:22    LISTEN\ntcp  0.0.0.0:80    LISTEN\ntcp  0.0.0.0:443   LISTEN\ntcp  127.0.0.1:5432 LISTEN'); break;
      case 'nmap': {
        const host = args[0] || 'localhost';
        print(`Starting nmap scan on ${host}...\n22/tcp   open  ssh\n80/tcp   open  http\n443/tcp  open  https\nScan complete.`);
        break;
      }
      case 'curl': print(args[0] ? `< HTTP/1.1 200 OK\n< Server: nginx\n< Content-Type: text/html\n\n<html>...</html>` : 'curl: try `curl <url>`', args[0] ? 'out' : 'err'); break;
      case 'cd': {
        const p = args[0] || '/home/admin';
        setCwd(p.startsWith('/') ? p : `${cwd}/${p}`);
        break;
      }
      default:
        print(`${bin}: command not found. Type 'help'.`, 'err');
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { run(input); setInput(''); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(idx); setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < 0) return;
      const idx = hIdx + 1;
      if (idx >= history.length) { setHIdx(-1); setInput(''); }
      else { setHIdx(idx); setInput(history[idx]); }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Terminal className="w-8 h-8 text-primary" /> Cyber Terminal Sandbox
        </h1>
        <p className="text-muted-foreground">A safe, simulated Linux terminal for learning offensive & defensive commands.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,280px] gap-4">
        <Card className="bg-black border-border">
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className="font-mono text-sm h-[480px] overflow-y-auto p-4 text-green-400"
              onClick={() => inputRef.current?.focus()}
            >
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    'whitespace-pre-wrap leading-relaxed',
                    l.type === 'in' && 'text-cyan-300',
                    l.type === 'err' && 'text-red-400',
                    l.type === 'sys' && 'text-yellow-300'
                  )}
                >
                  {l.text}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-cyan-300">{cwd} $</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  className="flex-1 bg-transparent outline-none text-green-300"
                  autoFocus
                  spellCheck={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Try these scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SCENARIOS.map((s) => (
                <div key={s.name} className="text-xs border rounded-md p-2">
                  <Badge variant="secondary" className="mb-1">{s.name}</Badge>
                  <p className="text-muted-foreground">{s.goal}</p>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => { setLines([]); setHistory([]); setCwd('/home/admin'); }}
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset terminal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CyberTerminalSandboxPage;
