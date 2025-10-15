/**
 * Mental Space Fab - Graph selector for MMM mental spaces
 * Configurable mental space types for security considerations
 */

// Default accepted types (only open and publ for security)
const DEFAULT_ACCEPTED_TYPES = [
  { 
    value: 'mntl:open', 
    label: 'mntl:open/{identity}',
    description: 'mntl:open - Owned by you, readable by the world' 
  },
  { 
    value: 'mntl:publ', 
    label: 'mntl:publ',
    description: 'mntl:publ - A true public commons' 
  }
];

class MntlSpaceFabWC extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this._currentIdentity = null;
    this._acceptedTypes = [...DEFAULT_ACCEPTED_TYPES];
    this._mentalSpace = 'mntl:publ';
    this._path = '/';
  }
  
  // Getters/Setters
  get currentIdentity() {
    return this._currentIdentity;
  }
  
  set currentIdentity(value) {
    this._currentIdentity = value;
    this.render();
  }
  
  get acceptedTypes() {
    return this._acceptedTypes;
  }
  
  set acceptedTypes(types) {
    if (Array.isArray(types) && types.length > 0) {
      this._acceptedTypes = types;
      // Ensure current selection is valid
      if (!types.find(t => t.value === this._mentalSpace)) {
        this._mentalSpace = types[0].value;
      }
      this.render();
    }
  }
  
  get value() {
    return this.getFullUri();
  }
  
  set value(uri) {
    this.parseUri(uri);
    this.render();
  }
  
  get mentalSpace() {
    return this._mentalSpace;
  }
  
  get path() {
    return this._path;
  }
  
  connectedCallback() {
    this.render();
  }
  
  needsIdentity(type) {
    return type.label.includes('{identity}');
  }
  
  parseUri(uri) {
    if (!uri) return;
    
    // Try each accepted type
    for (const type of this._acceptedTypes) {
      const basePrefix = type.value; // e.g., "mntl:open"
      
      if (uri.startsWith(basePrefix)) {
        this._mentalSpace = type.value;
        
        // Check if this type needs identity
        if (this.needsIdentity(type) && this._currentIdentity) {
          // Format: mntl:open/identity/path
          const afterBase = uri.substring(basePrefix.length); // e.g., "/mailto:alice@ex.io/notes"
          
          // Find the second slash to separate identity from path
          const firstSlash = afterBase.indexOf('/');
          if (firstSlash !== -1) {
            const secondSlash = afterBase.indexOf('/', firstSlash + 1);
            if (secondSlash !== -1) {
              this._path = afterBase.substring(secondSlash); // e.g., "/notes"
            } else {
              this._path = '/';
            }
          } else {
            this._path = '/';
          }
        } else {
          // Format: mntl:publ/path (no identity)
          this._path = uri.substring(basePrefix.length) || '/';
        }
        
        // Ensure path starts with /
        if (!this._path.startsWith('/')) {
          this._path = '/' + this._path;
        }
        
        return;
      }
    }
    
    // Fallback: just set path
    this._path = uri.startsWith('/') ? uri : '/' + uri;
  }
  
  getFullUri() {
    const type = this._acceptedTypes.find(t => t.value === this._mentalSpace);
    if (!type) return this._mentalSpace + this._path;
    
    // Ensure path starts with /
    const cleanPath = this._path.startsWith('/') ? this._path : '/' + this._path;
    
    // If type has {identity} placeholder and we have an identity, insert it
    if (this.needsIdentity(type) && this._currentIdentity) {
      // Format: mntl:open/mailto:alice@ex.io/path
      return type.value + '/' + this._currentIdentity + cleanPath;
    } else {
      // Format: mntl:publ/path (no identity)
      return type.value + cleanPath;
    }
  }
  
  getDescription() {
    const type = this._acceptedTypes.find(t => t.value === this._mentalSpace);
    return type ? type.description : '';
  }
  
  normalizePath(path) {
    // Ensure path starts with /
    if (!path) return '/';
    return path.startsWith('/') ? path : '/' + path;
  }
  
  render() {
    const identity = this._currentIdentity || '{identity}';
    const hasIdentity = !!this._currentIdentity;
    
    // If current selection needs identity but we don't have one, switch to publ
    const currentType = this._acceptedTypes.find(t => t.value === this._mentalSpace);
    if (currentType && this.needsIdentity(currentType) && !hasIdentity) {
      // Find first type that doesn't need identity
      const fallbackType = this._acceptedTypes.find(t => !this.needsIdentity(t));
      if (fallbackType) {
        this._mentalSpace = fallbackType.value;
      }
    }
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .fab-container {
          display: flex;
          align-items: stretch;
        }
        
        .mental-space-select {
          padding: 10px 15px;
          border: 2px solid #ced4da;
          border-right: none;
          border-radius: 6px 0 0 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          font-family: 'Monaco', 'Courier New', monospace;
          min-width: 240px;
          color: #495057;
          text-align: right;
          direction: rtl;
        }
        
        .mental-space-select option {
          direction: ltr;
          text-align: left;
        }
        
        .mental-space-select option:disabled {
          color: #999;
          font-style: italic;
        }
        
        .mental-space-select:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: -0.2rem 0 0 0.2rem rgba(0, 123, 255, 0.25);
          z-index: 1;
        }
        
        .path-input {
          flex: 1;
          padding: 10px 15px;
          border: 2px solid #ced4da;
          border-radius: 0 6px 6px 0;
          font-size: 14px;
          font-family: 'Monaco', 'Courier New', monospace;
          color: #495057;
        }
        
        .path-input:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0.2rem 0 0 0.2rem rgba(0, 123, 255, 0.25);
          z-index: 1;
        }
        
        .description {
          font-size: 12px;
          color: #6c757d;
          margin-top: 6px;
          font-style: italic;
        }
      </style>
      
      <div class="fab-container">
        <select class="mental-space-select" id="mental-space">
          ${this._acceptedTypes.map(type => {
            const label = type.label.replace('{identity}', identity);
            const selected = this._mentalSpace === type.value ? 'selected' : '';
            // Disable options that need identity when we don't have one
            const disabled = (this.needsIdentity(type) && !hasIdentity) ? 'disabled' : '';
            return `<option value="${type.value}" ${selected} ${disabled}>${label}</option>`;
          }).join('')}
        </select>
        <input 
          type="text" 
          class="path-input" 
          id="path-input"
          placeholder="/path"
          value="${this._path}"
        />
      </div>
      <div class="description" id="description">${this.getDescription()}</div>
    `;
    
    // Attach listeners after render
    this.attachEventListeners();
    
    // Emit initial value
    this.emitChange();
  }
  
  attachEventListeners() {
    const select = this.shadowRoot.getElementById('mental-space');
    const input = this.shadowRoot.getElementById('path-input');
    
    select?.addEventListener('change', (e) => {
      this._mentalSpace = e.target.value;
      
      // Update description
      const desc = this.shadowRoot.getElementById('description');
      if (desc) desc.textContent = this.getDescription();
      
      this.emitChange();
    });
    
    input?.addEventListener('input', (e) => {
      let value = e.target.value;
      
      // Ensure leading slash
      if (value && !value.startsWith('/')) {
        value = '/' + value;
        e.target.value = value;
      }
      
      this._path = value || '/';
      this.emitChange();
    });
    
    input?.addEventListener('blur', (e) => {
      // Normalize on blur
      const normalized = this.normalizePath(e.target.value);
      if (normalized !== e.target.value) {
        e.target.value = normalized;
        this._path = normalized;
        this.emitChange();
      }
    });
  }
  
  emitChange() {
    this.dispatchEvent(new CustomEvent('graph-changed', {
      detail: {
        mentalSpace: this._mentalSpace,
        path: this._path,
        fullUri: this.getFullUri()
      },
      bubbles: true,
      composed: true
    }));
  }
  
  // Public API methods
  getValue() {
    return this.getFullUri();
  }
  
  setValue(uri) {
    this.value = uri;
  }
}

customElements.define('mntl-space-fab', MntlSpaceFabWC);

export { MntlSpaceFabWC, DEFAULT_ACCEPTED_TYPES };
