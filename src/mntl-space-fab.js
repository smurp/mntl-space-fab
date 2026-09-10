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
    
    // an edit the user has not accepted yet
    this._dirty = false;
    
    // Path control properties
    this._pathValue = null;
    this._pathEditable = true;
    this._showPath = true;
  }
  
  // Existing getters/setters
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
    // the HOST speaking, not the user: nothing here is awaiting acceptance
    this._dirty = false;
    this.render();
  }
  
  get mentalSpace() {
    return this._mentalSpace;
  }
  
  get path() {
    return this._pathValue !== null ? this._pathValue : this._path;
  }
  
  // New property: pathValue
  get pathValue() {
    return this._pathValue;
  }
  
  set pathValue(value) {
    this._pathValue = value;
    this.render();
  }
  
  // New property: pathEditable
  get pathEditable() {
    return this._pathEditable;
  }
  
  set pathEditable(value) {
    this._pathEditable = Boolean(value);
    this.render();
  }
  
  // New property: showPath
  get showPath() {
    return this._showPath;
  }
  
  set showPath(value) {
    this._showPath = Boolean(value);
    this.render();
  }
  
  connectedCallback() {
    // render() ends by attaching; attaching again here bound every
    // listener TWICE to the same nodes, so each change emitted
    // graph-changed twice and each keystroke re-aimed the host twice over
    this.render();
  }
  
  needsIdentity(type) {
    return type.label.includes('{identity}');
  }
  
  parseUri(uri) {
    if (!uri) return;
    
    for (const type of this._acceptedTypes) {
      const basePrefix = type.value;
      
      if (uri.startsWith(basePrefix)) {
        this._mentalSpace = type.value;
        
        if (this.needsIdentity(type) && this._currentIdentity) {
          const afterBase = uri.substring(basePrefix.length);
          const firstSlash = afterBase.indexOf('/');
          
          if (firstSlash !== -1) {
            const secondSlash = afterBase.indexOf('/', firstSlash + 1);
            if (secondSlash !== -1) {
              this._path = afterBase.substring(secondSlash);
            } else {
              this._path = '/';
            }
          }
        } else {
          const afterBase = uri.substring(basePrefix.length);
          this._path = afterBase || '/';
        }
        return;
      }
    }
  }
  
  getFullUri() {
    const type = this._acceptedTypes.find(t => t.value === this._mentalSpace);
    const effectivePath = this._pathValue !== null ? this._pathValue : this._path;
    
    if (type && this.needsIdentity(type) && this._currentIdentity) {
      const identity = this._currentIdentity.replace(/^mailto:/, '');
      return `${this._mentalSpace}/${identity}${effectivePath}`;
    }
    
    return `${this._mentalSpace}${effectivePath}`;
  }
  
  getValue() {
    return this.getFullUri();
  }

  render() {
    const currentType = this._acceptedTypes.find(t => t.value === this._mentalSpace);
    const description = currentType ? currentType.description : '';
    
    const effectivePath = this._pathValue !== null ? this._pathValue : this._path;
    const isPathDisabled = this._pathValue !== null || !this._pathEditable;
    
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .input-row {
        display: flex;
        gap: 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
        background: white;
      }
      
      .input-row:focus-within {
        outline: 2px solid #0066cc;
        outline-offset: 1px;
      }
      
      select {
        flex: 0 0 auto;
        padding: 0.5rem;
        border: none;
        background: white;
        font-size: 0.9rem;
        cursor: pointer;
        outline: none;
      }
      
      select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      input {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-left: 1px solid #e0e0e0;
        font-size: 0.9rem;
        outline: none;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      }
      
      input:disabled {
        background: #f5f5f5;
        color: #666;
        cursor: not-allowed;
      }
      
      /* THE ACCEPT. Every edit here is a decision the user has not made
         yet — picking a scope, typing a path — and each emitted change
         re-aims a host and opens a subscription. So the row ends in a
         control that says "this one", pressable even when nothing was
         edited, because the commonest case is that the offered value is
         already right. */
      button.accept {
        flex: 0 0 auto;
        border: none;
        border-left: 1px solid #e0e0e0;
        background: #f5f5f5;
        color: #444;
        font: inherit;
        font-size: 1rem;
        line-height: 1;
        padding: 0 0.7rem;
        cursor: pointer;
        min-width: 2.6rem;
        min-height: 2.4rem;      /* a thumb, not a mouse pointer */
      }
      button.accept:hover { background: #e8e8e8; color: #000; }
      button.accept:focus-visible { outline: 2px solid #0066cc; outline-offset: -2px; }
      /* edited but not yet accepted: the button is where the eye should go */
      button.accept.dirty { background: #0066cc; color: #fff; }
      button.accept.dirty:hover { background: #0055aa; }

      .description {
        font-size: 0.85rem;
        color: #666;
        padding: 0.25rem 0.5rem;
      }
    </style>
    
    <div class="container">
      <div class="input-row">
        <select id="mental-space">
          ${this._acceptedTypes.map(type => {
            const needsId = this.needsIdentity(type);
            const disabled = needsId && !this._currentIdentity;
            const label = type.label.replace('{identity}', 
              this._currentIdentity ? this._currentIdentity.replace(/^mailto:/, '') : '{identity}');
            
            return `
      <option 
    value="${type.value}" 
    ${type.value === this._mentalSpace ? 'selected' : ''}
    ${disabled ? 'disabled' : ''}
      >
      ${label}
    </option>
      `;
          }).join('')}
        </select>
        
        ${this._showPath ? `
      <input 
    type="text" 
    id="path-input" 
    value="${effectivePath}"
    placeholder="/path"
    ${isPathDisabled ? 'disabled' : ''}
      />
      ` : ''}
        <button
    type="button"
    id="accept"
    class="accept${this._dirty ? ' dirty' : ''}"
    title="use this mental space"
    aria-label="use this mental space"
      >✓</button>
      </div>
      
      <div class="description">${description}</div>
    </div>
  `;
    
    // CRITICAL FIX: Re-attach event listeners after every render
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    const select = this.shadowRoot.getElementById('mental-space');
    const pathInput = this.shadowRoot.getElementById('path-input');
    
    const accept = this.shadowRoot.getElementById('accept');
    
    // AN EDIT IS NOT A DECISION. The scope and the path change this
    // element's state and nothing else; graph-changed is emitted when the
    // user says so, by the accept control or by Enter in the path. Before
    // this the select emitted on change and the path on every keystroke,
    // which re-aimed the host per character and left the commonest case —
    // the offered value is already right — with no gesture at all.
    if (select) {
      select.addEventListener('change', (e) => {
        this._mentalSpace = e.target.value;
        this._dirty = true;
        this.render();                 // the description follows the scope
        this.shadowRoot.getElementById('mental-space')?.focus();
      });
    }
    
    if (pathInput && this._pathEditable && this._pathValue === null) {
      pathInput.addEventListener('input', (e) => {
        let value = e.target.value;
        
        if (!value.startsWith('/')) {
          value = '/' + value;
          e.target.value = value;
        }
        
        this._path = value;
        this._dirty = true;
        accept?.classList.add('dirty');   // no re-render: it would eat the caret
      });
      pathInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        this.submit();
      });
    }
    
    if (accept) accept.addEventListener('click', () => this.submit());
  }
  
  /**
   * The user's decision: emit what the controls now hold, whether or not
   * anything was edited — accepting the offered value is a choice too.
   */
  submit() {
    this._dirty = false;
    this.shadowRoot.getElementById('accept')?.classList.remove('dirty');
    this.emitChange();
  }
  
  emitChange() {
    this.dispatchEvent(new CustomEvent('graph-changed', {
      detail: {
        mentalSpace: this._mentalSpace,
        path: this.path,
        fullUri: this.getFullUri()
      },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('mntl-space-fab', MntlSpaceFabWC);
