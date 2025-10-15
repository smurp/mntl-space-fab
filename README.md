# mntl-space-fab

A standalone web component for selecting MMM mental space graphs (mntl: URN picker).

![license](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)

## Features

- 🎯 **Mental space type selection** - Choose mntl:open, mntl:publ, etc.
- 📝 **Path input** - Hierarchical path within mental space
- 🔒 **Configurable types** - Inject only the mental space types you support
- 🎨 **Identity-aware labels** - Shows {identity} in dropdown labels
- 📖 **Descriptive hints** - Explains each mental space type
- ✨ **Event-driven** - Emits graph-changed events

## Installation

### For Development (using npm link)

```bash
# In ~/REPOS/mntl-space-fab
npm install
npm link

# In your consuming project (e.g., quad-form, ttl-editor-form)
npm link @mmmlib/mntl-space-fab
```

### For Production (using GitHub)

Add to your package.json:

```json
{
  "dependencies": {
    "@mmmlib/mntl-space-fab": "github:smurp/mntl-space-fab#main"
  }
}
```

Then:

```bash
npm install
```

## Usage

### Basic Usage

```html
<script type="module" src="path/to/mntl-space-fab.js"></script>
<mntl-space-fab></mntl-space-fab>
```

### With Configuration

```javascript
const fab = document.querySelector('mntl-space-fab');

// Set current user identity
fab.currentIdentity = 'mailto:alice@example.com';

// Set initial value
fab.value = 'mntl:open/alice/notes';

// Restrict to only supported types (security consideration)
fab.acceptedTypes = [
  { value: 'mntl:open', label: 'mntl:open/{identity}', 
    description: 'mntl:open - Owned by you, readable by the world' },
  { value: 'mntl:publ', label: 'mntl:publ', 
    description: 'mntl:publ - A true public commons' }
];

// Listen for changes
fab.addEventListener('graph-changed', (e) => {
  console.log('Graph:', e.detail.fullUri);
});
```

## API Reference

### Properties

- `currentIdentity` - User identity string
- `value` - Full graph URI (get/set)
- `mentalSpace` - Current mental space type
- `path` - Current path within mental space
- `acceptedTypes` - Array of allowed mental space types

### Events

- `graph-changed` - Fired when selection changes
  - `detail: { mentalSpace, path, fullUri }`

### Default Types

```javascript
// Only these are enabled by default (security)
[
  { value: 'mntl:open', label: 'mntl:open/{identity}',
    description: 'mntl:open - Owned by you, readable by the world' },
  { value: 'mntl:publ', label: 'mntl:publ',
    description: 'mntl:publ - A true public commons' }
]
```

## License

AGPL-3.0-or-later
