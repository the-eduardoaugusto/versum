# @versum/logger

Colored console logger with sensitivity masking for Bun.

```bash
bun add @versum/logger
```

## Usage
```typescript
import { info, warn, error, debug, success, sensitive, logger } from "@versum/logger";
info("msg") | warn("msg") | error("msg") | debug("msg") | success("msg")
logger("info", "msg") | logger({ level: "error", color: "red" }, "msg")
sensitive(value)  // masked in prod, visible in dev when DEBUG=1
```

## API
`logger(config, ...args)` — config: `level`, `color?`, `icon?`
`sensitive<T>(value, shouldMask?)` — works on strings, objects, arrays
`setEnv(handlers)` — override isDev/isDebug detection (for testing)
`resetEnv()` — reset to default Bun handlers

## Env
| Var | Effect |
|-----|--------|
| `BUN_ENV=production\|staging` | Prod mode: suppress debug, mask sensitive |
| `DEBUG=1` | Show sensitive values in dev |

## Exported Types
`LogLevel` | `LoggerConfig` | `LoggerConfigObject` | `LoggerConfigLevel`
