# myday-web — Claude Notes

## Testing

### Framework
- **Vitest** (`npm test` for a single run, `npm run test:watch` for watch mode)
- Environment: `jsdom` (browser-like, with `globals: true`)
- Setup file: `src/test/setup.ts` — imports `fake-indexeddb/auto` to mock IndexedDB

### Running Tests
```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

### Test File Locations
Follow the co-location convention — test files live next to the source:
- `src/lib/*.test.ts` — pure utility functions
- `src/services/<name>/<name>.service.test.ts` — service layer

### Service Tests (Dexie / IndexedDB)
Service tests hit the real Dexie database via `fake-indexeddb`. Each test file must:
```ts
beforeEach(async () => {
  await db.open();
  await db.<table>.clear();
});

afterEach(async () => {
  await db.<table>.clear();
});
```

#### Dexie Cloud ID Prefixes
The `dexie-cloud-addon` is always active (even without network sync) and validates that manually supplied IDs use the correct per-table prefix. These prefixes **must** match exactly or Dexie will throw a `ConstraintError`:

| Table        | Required prefix |
|--------------|-----------------|
| `expenses`   | `exp`           |
| `todos`      | `tds`           |
| `categories` | `ctg`           |
| `budget`     | `bdg`           |

> **Bug found & fixed:** `TodoService` originally used `tod` prefix — corrected to `tds`.

#### Querying After Update
`db.<table>.get(id)` can return `undefined` after a `.update()` call in the test environment (Dexie Cloud internal key handling). Use `db.<table>.toArray()` to verify mutations in tests:
```ts
// prefer this in tests
const all = await db.expenses.toArray();
expect(all[0].title).toBe('Updated title');

// avoid this after updates
const record = await db.expenses.get(id); // may return undefined
```

### Pure Utility Tests
No mocks or DB setup needed. Use fixed dates to avoid flakiness:
```ts
const FIXED = new Date('2024-01-15T12:00:00'); // Jan 15, 2024
```

### TypeScript Globals
`vitest/globals` is included in `tsconfig.app.json` `"types"` so `describe`, `it`, `expect` etc. are available without imports. Explicit imports (`import { describe, it } from 'vitest'`) are also fine and are used in the service test files for clarity.
